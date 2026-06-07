import type { Command } from './command';
import { GLOBAL_OPTIONS } from './command';
import { t } from './i18n';

export type { Command, OptionDef } from './command';

interface CommandNode {
  command?: Command;
  children: Map<string, CommandNode>;
}

class CommandRegistry {
  private root: CommandNode = { children: new Map() };

  register(path: string, command: Command): void {
    const parts = path.split(' ');
    let node = this.root;
    for (const part of parts) {
      if (!node.children.has(part)) {
        node.children.set(part, { children: new Map() });
      }
      node = node.children.get(part)!;
    }
    node.command = command;
  }

  getAllCommands(): Command[] {
    const commands: Command[] = [];
    const traverse = (node: CommandNode) => {
      if (node.command) commands.push(node.command);
      for (const child of node.children.values()) {
        traverse(child);
      }
    };
    traverse(this.root);
    return commands;
  }

  resolve(commandPath: string[]): { command: Command; extra: string[] } {
    let node = this.root;
    const matched: string[] = [];

    for (const part of commandPath) {
      const child = node.children.get(part);
      if (!child) break;
      node = child;
      matched.push(part);
    }

    if (node.command) {
      return { command: node.command, extra: commandPath.slice(matched.length) };
    }

    // Single child: auto-forward (e.g. `mimo asr` → `mimo asr audio.wav`)
    if (matched.length > 0 && node.children.size === 1) {
      const [, child] = node.children.entries().next().value as [string, CommandNode];
      if (child.command) {
        return { command: child.command, extra: commandPath.slice(matched.length) };
      }
    }

    // Alias-only group: auto-forward when every child points to the same command.
    // Example: `mimo search "query"` should work even when both `search query`
    // and `search web` are registered as aliases for the same implementation.
    if (matched.length > 0 && node.children.size > 1) {
      const children = Array.from(node.children.values());
      const commands = children.map((child) => child.command);
      const first = commands[0];
      if (first && commands.every((command) => command === first)) {
        return { command: first, extra: commandPath.slice(matched.length) };
      }
    }

    // If we matched some path but no command, show help for that group
    if (matched.length > 0 && node.children.size > 0) {
      const subcommands = Array.from(node.children.entries())
        .map(([name, n]) => {
          if (n.command) return `  ${matched.join(' ')} ${name}    ${t(n.command.description)}`;
          const subs = Array.from(n.children.keys()).join(', ');
          return `  ${matched.join(' ')} ${name} [${subs}]`;
        })
        .join('\n');
      throw new Error(
        `${t('registry.unknownCommand', { command: commandPath.join(' ') })}\n\n${t('registry.availableCommands')}\n${subcommands}\n\n${t('registry.runHelp', { command: matched.join(' ') })}`,
      );
    }

    throw new Error(
      `${t('registry.unknownCommand', { command: commandPath.join(' ') })}\n\n${t('registry.runHelpRoot')}`,
    );
  }

  // Color helpers — no-ops when output is not a TTY
  private bold(s: string, out: NodeJS.WritableStream): string {
    if ('isTTY' in out && out.isTTY) return `\x1b[1m${s}\x1b[0m`;
    return s;
  }

  private accent(s: string, out: NodeJS.WritableStream): string {
    // MiMo orange: #FF6900 → rgb(255, 105, 0)
    if ('isTTY' in out && out.isTTY) return `\x1b[38;2;255;105;0m${s}\x1b[0m`;
    return s;
  }

  private dim(s: string, out: NodeJS.WritableStream): string {
    if ('isTTY' in out && out.isTTY) return `\x1b[2m${s}\x1b[0m`;
    return s;
  }

  printHelp(commandPath: string[], out: NodeJS.WritableStream = process.stdout): void {
    if (commandPath.length === 0) {
      this.printRootHelp(out);
      return;
    }

    let node = this.root;
    for (const part of commandPath) {
      const child = node.children.get(part);
      if (!child) {
        this.printRootHelp(out);
        return;
      }
      node = child;
    }

    if (node.command) {
      this.printCommandHelp(node.command, out);
      // 如果该命令还有子命令，追加子命令列表
      if (node.children.size > 0) {
        const prefix = commandPath.join(' ');
        out.write(`\n${this.bold(t('help.commands'), out)}\n`);
        this.printChildren(node, prefix, out);
      }
      return;
    }

    // Group help (e.g. `mimo chat --help`)
    const prefix = commandPath.join(' ');
    out.write(`\n${this.bold(t('help.usage'), out)} mimo ${prefix} <command> [flags]\n\n`);
    out.write(`${this.bold(t('help.commands'), out)}\n`);
    this.printChildren(node, prefix, out);
    out.write('\n');
  }

  private printRootHelp(out: NodeJS.WritableStream): void {
    // MMC brand logo
    const LOGO = [
      '███╗   ███╗███╗   ███╗███████╗',
      '████╗ ████║████╗ ████║██╔════╝',
      '██╔████╔██║██╔████╔██║██╔     ',
      '██║╚██╔╝██║██║╚██╔╝██║██╔     ',
      '██║ ╚═╝ ██║██║ ╚═╝ ██║███████╗',
      '╚═╝     ╚═╝╚═╝     ╚═╝╚══════╝',
    ];
    // 小米品牌渐变：从活力橙到科技红，体现小米气质
    const GRADIENT: [number, number, number][] = [
      [255, 165, 0],   // 亮橙 #FFA500
      [255, 140, 0],   // 深橙 #FF8C00
      [255, 105, 0],   // 小米橙 #FF6900
      [245, 85, 0],    // 橙红 #F55500
      [230, 65, 0],    // 深橙红 #E64100
      [210, 45, 0],    // 科技红 #D22D00
    ];

    out.write('\n');
    for (let i = 0; i < LOGO.length; i++) {
      if ('isTTY' in out && out.isTTY) {
        const [r, g, b] = GRADIENT[i]!;
        out.write(`\x1b[1;38;2;${r};${g};${b}m${LOGO[i]}\x1b[0m\n`);
      } else {
        out.write(LOGO[i]! + '\n');
      }
    }

    const b = (s: string) => this.bold(s, out);
    const a = (s: string) => this.accent(s, out);
    const d = (s: string) => this.dim(s, out);

    // Dynamically build the resources section from registered commands
    const topGroups = this.collectTopGroups();

    let resourcesSection = '';
    if (topGroups.length > 0) {
      const maxNameLen = Math.max(...topGroups.map((g) => g.name.length));
      resourcesSection = `${b(t('main.resources'))}\n`;
      for (const group of topGroups) {
        resourcesSection += `  ${a(group.name.padEnd(maxNameLen + 2))} ${d(group.description)}\n`;
      }
      resourcesSection += '\n';
    }

    const maxFlagLen = Math.max(...GLOBAL_OPTIONS.map((o) => o.flag.length));
    let globalFlagsSection = `${b(t('main.globalFlags'))}\n`;
    for (const opt of GLOBAL_OPTIONS) {
      globalFlagsSection += `  ${a(opt.flag.padEnd(maxFlagLen + 2))} ${d(t(opt.description))}\n`;
    }

    out.write(`
${b(t('main.usage'))}

${resourcesSection}${globalFlagsSection}
${b(t('main.gettingHelp'))}
  ${d(t('main.helpHint1'))}
  ${d(t('main.helpHint2'))} mimo chat --help
`);
  }

  private printCommandHelp(cmd: Command, out: NodeJS.WritableStream): void {
    const b = (s: string) => this.bold(s, out);
    const a = (s: string) => this.accent(s, out);
    const d = (s: string) => this.dim(s, out);

    out.write(`\n${t(cmd.description)}\n`);
    if (cmd.usage) out.write(`${b(t('help.usage'))} ${cmd.usage}\n`);
    if (cmd.options && cmd.options.length > 0) {
      const maxLen = Math.max(...cmd.options.map((o) => o.flag.length));
      out.write(`\n${b(t('help.options'))}\n`);
      for (const opt of cmd.options) {
        out.write(`  ${a(opt.flag.padEnd(maxLen + 2))} ${d(t(opt.description))}\n`);
      }
    }
    if (cmd.examples && cmd.examples.length > 0) {
      out.write(`\n${b(t('help.examples'))}\n`);
      for (const ex of cmd.examples) {
        out.write(`  ${d(ex)}\n`);
      }
    }
    if (cmd.apiDocs) {
      out.write(`\n${b(t('help.apiRef'))} ${d(cmd.apiDocs)}\n`);
    }
    out.write(`\n${d(t('help.globalHint'))}\n`);
    out.write(`${d(t('help.globalHintRun'))}\n`);
  }

  private printChildren(node: CommandNode, prefix: string, out: NodeJS.WritableStream): void {
    const entries: Array<{ fullName: string; description: string }> = [];
    const collect = (n: CommandNode, p: string) => {
      for (const [name, child] of n.children) {
        if (child.command) entries.push({ fullName: `${p} ${name}`, description: t(child.command.description) });
        if (child.children.size > 0) collect(child, `${p} ${name}`);
      }
    };
    collect(node, prefix);
    const maxLen = Math.max(...entries.map((e) => e.fullName.length));
    for (const { fullName, description } of entries) {
      out.write(`  ${this.accent(fullName.padEnd(maxLen), out)}  ${this.dim(description, out)}\n`);
    }
  }

  /** Collect top-level groups with their subcommand descriptions for root help. */
  private collectTopGroups(): Array<{ name: string; description: string }> {
    const groups: Array<{ name: string; description: string }> = [];
    for (const [name, node] of this.root.children) {
      if (node.command) {
        // Direct command at top level
        groups.push({ name, description: t(node.command.description) });
      } else if (node.children.size > 0) {
        // Group node — collect subcommand names
        const subNames = Array.from(node.children.keys());
        const firstChild = node.children.values().next().value as CommandNode | undefined;
        const desc = firstChild?.command?.description ? t(firstChild.command.description) : subNames.join(', ');
        groups.push({ name, description: desc });
      }
    }
    return groups;
  }
}

/** Singleton registry instance */
export const registry = new CommandRegistry();

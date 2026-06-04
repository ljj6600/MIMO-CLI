export function maskToken(token: string): string {
  if (token.length <= 8) {
    return token.length <= 2 ? '**' : token.slice(0, 2) + '...' + token.slice(-2);
  }
  return token.slice(0, 4) + '...' + token.slice(-4);
}

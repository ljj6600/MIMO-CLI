const CI_ENV_VARS = [
  'CI',
  'CONTINUOUS_INTEGRATION',
  'GITHUB_ACTIONS',
  'GITLAB_CI',
  'JENKINS_URL',
  'TRAVIS',
  'CIRCLECI',
  'BUILDKITE',
  'TF_BUILD',
  'TEAMCITY_VERSION',
  'APPVEYOR',
  'NETLIFY',
  'VERCEL',
] as const;

export function isInteractive(): boolean {
  return process.stdout.isTTY === true;
}

export function isCI(): boolean {
  return CI_ENV_VARS.some((key) => {
    const value = process.env[key];
    return value !== undefined && value !== '' && value !== '0' && value !== 'false';
  });
}

/* eslint-disable node/no-process-env */
// Get current branch from GitHub Actions environment variable
const currentBranch = process.env.GITHUB_REF_NAME;

console.log(`Current Branch: ${currentBranch}`);

// Conditionally enable changelog plugin based on current branch
const changelogPluginSettings =
  currentBranch === 'main' ? ['@semantic-release/changelog'] : [];

/**
 * @type {import('semantic-release').GlobalConfig}
 */
const config = {
  branches: [
    'main',
    {
      name: 'develop',
      prerelease: true,
    },
  ],
  tagFormat: '${version}',
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
      },
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
      },
    ],
    ...changelogPluginSettings,
    [
      '@semantic-release/npm',
      {
        npmPublish: false,
      },
    ],
    [
      '@semantic-release/exec',
      {
        prepareCmd: 'node version-bump.mjs ${nextRelease.version}',
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: [
          'CHANGELOG.md',
          'package.json',
          'manifest.json',
          'versions.json',
        ],
        message:
          'chore(release): ${nextRelease.version}\n\n${nextRelease.notes}',
      },
    ],
    [
      '@semantic-release/github',
      {
        assets: [
          { path: 'main.js', label: 'main.js' },
          { path: 'manifest.json', label: 'manifest.json' },
          { path: 'styles.css', label: 'styles.css' },
        ],
      },
    ],
    [
      '@saithodev/semantic-release-backmerge',
      {
        backmergeStrategy: 'rebase',
        forcePush: true,
        backmergeBranches: [
          {
            from: 'main',
            to: 'develop',
          },
        ],
      },
    ],
  ],
};

console.log(`Semantic Release Config: ${JSON.stringify(config, null, 2)}`);

export default config;

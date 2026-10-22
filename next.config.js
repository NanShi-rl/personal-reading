/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
// GitHub repository name: personal-reading
const repoName = 'personal-reading';

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // When deploying to user.github.io/personal-reading
  basePath: isProd ? `/${repoName}` : '',
  assetPrefix: isProd ? `/${repoName}/` : '',
  env: {
    NEXT_PUBLIC_BASE_PATH: isProd ? `/${repoName}` : '',
    NEXT_PUBLIC_REPO_OWNER: 'NanShi-rl',
    NEXT_PUBLIC_REPO_NAME: 'personal-reading',
  },
};

module.exports = nextConfig;

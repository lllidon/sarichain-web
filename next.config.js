/** @type {import('next').NextConfig} */
module.exports = {
  experimental: { serverActions: { bodySizeLimit: '3mb' } },
  allowedDevOrigins: (process.env.NEXT_DEV_ALLOWED_HOSTS || '')
    .split(',')
    .map(host => host.trim().toLowerCase())
    .filter(host => /^[a-z0-9-]+(?:\.[a-z0-9-]+)*$/.test(host)),
};

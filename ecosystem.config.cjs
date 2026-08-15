module.exports = {
  apps: [
    {
      name: 'veterinari-org',
      script: '/var/www/veterinari-org/dist/server/entry.mjs',
      interpreter: 'node',
      args: '--host 0.0.0.0 --port 4321',
      cwd: '/var/www/veterinari-org',
      env: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
        PORT: '4321',
      },
      max_restarts: 10,
      restart_delay: 3000,
    },
  ],
};

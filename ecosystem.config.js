// PM2 konfiguratsiyasi
module.exports = {
  apps: [
    {
      name: 'avtojon-api',
      script: './apps/api/src/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5002
      },
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
}

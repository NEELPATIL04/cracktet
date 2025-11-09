module.exports = {
  apps: [
    {
      name: 'cracktet',
      script: 'npm',
      args: 'start',
      instances: 1, // Use single instance in fork mode
      exec_mode: 'fork', // Use fork mode for Next.js compatibility
      autorestart: true,
      watch: false, // DISABLE watch in production
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Error handling
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
      // Log settings
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      merge_logs: true,
      time: true
    }
  ]
};
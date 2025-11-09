module.exports = {
  apps: [
    {
      name: 'cracktet',
      script: 'npm',
      args: 'start',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster', // Enable cluster mode
      autorestart: true,
      watch: false, // DISABLE watch in production to prevent restart loops
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        watch: true,
        ignore_watch: [
          'node_modules',
          '.git',
          'storage',
          '*.log',
          '.next',
          'public/uploads',
          'temp',
          '*.pdf',
          '*.jpg',
          '*.jpeg',
          '*.png'
        ]
      },
      // Cluster-specific settings
      instance_var: 'INSTANCE_ID', // Different instance ID for each cluster
      merge_logs: true, // Combine logs from all instances
      // Error handling
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000,
      // Log settings
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
};
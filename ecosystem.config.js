module.exports = {
  apps: [
    {
      name: 'cracktet',
      script: 'npm',
      args: 'start',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster', // Enable cluster mode
      autorestart: true,
      watch: true,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Exclude storage directory from watch to prevent restart loops during PDF processing
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
      ],
      // Watch only specific directories that should trigger restarts
      watch_options: {
        followSymlinks: false,
        usePolling: false,
        alwaysStat: false,
        depth: 99,
        ignorePermissionErrors: false
      },
      // Cluster-specific settings
      instance_var: 'INSTANCE_ID', // Different instance ID for each cluster
      merge_logs: true, // Combine logs from all instances
      // Error handling
      min_uptime: '10s',
      max_restarts: 5,
      restart_delay: 4000,
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000
    }
  ]
};
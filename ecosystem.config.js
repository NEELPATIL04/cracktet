module.exports = {
  apps: [
    {
      name: "cracktet",
      script: "./node_modules/next/dist/bin/next",
      args: "start",
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      ignore_watch: ["node_modules", "storage", ".git", "logs"],
      max_memory_restart: "2G",
      node_args: "--max-old-space-size=2048",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // Restart behaviour
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 4000,
      // Graceful shutdown
      kill_timeout: 10000,
      listen_timeout: 20000,
      // Logs
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      merge_logs: true,
      time: true,
    },
  ],
};

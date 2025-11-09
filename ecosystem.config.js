module.exports = {
  apps: [
    {
      name: "cracktet",
      script: "npm",
      args: "start",
      instances: "max", // use all CPU cores; or set a number like 2,4
      exec_mode: "cluster", // cluster mode
      autorestart: true,
      watch: false, // keep watch disabled in production
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

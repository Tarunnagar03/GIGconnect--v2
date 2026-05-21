module.exports = {
  apps: [
    {
      name: "gigconnect-backend",
      script: "./server/server.js",
      env: {
        NODE_ENV: "production",
      },
      instances: "max", // Runs on all available CPU cores for enterprise scaling
      exec_mode: "cluster",
      autorestart: true, // Auto-restarts on crash
      max_memory_restart: "1G" // Restarts if memory leak exceeds 1GB
    }
  ]
};
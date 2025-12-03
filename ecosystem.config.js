module.exports = {
  apps: [{
    name: "vidoose-api",
    script: "./dist/server.js",
    instances: 1, // Free tier limit
    autorestart: true, // 🔥 SELF-HEALING: Restart on crash
    watch: false,
    max_memory_restart: '450M', // Restart if memory leaks > 450MB (Render Limit 512MB)
    env: {
      NODE_ENV: "production",
    }
  }]
}
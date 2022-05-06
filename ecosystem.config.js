module.exports = {
  apps : [{
    name   : "avoid",
    script : "./dist/shard.js",
    max_memory_restart : "512M",
    error_file : "./.pm2/logs/error.log",
    out_file : "./.pm2/logs/out.log",
    exec_mode : "fork",
    env: {
      NODE_ENV: "production",
    },
  }]
}

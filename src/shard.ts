import { ShardingManager, ShardingManagerOptions } from "discord.js";
import config from "./utils/config";

const isProduction = process.env.NODE_ENV === "production";

const manager = new ShardingManager("dist/app.js", {
  respawn: true,
  token: config.token,
  totalShards: isProduction ? "auto" : 1,
} as ShardingManagerOptions);

manager.spawn({ timeout: 120000 });

import { model, Schema } from "mongoose";
import { GuildModels } from "@avoid/interfaces";

import config from "@avoid/utils/config";

const GuildSchema = new Schema<GuildModels>({
  id: { required: true, type: String },
  prefix: { required: false, type: [String], default: config.prefix },
  cmdRunner: { required: false, type: Object, default: null },
  disableCommands: { required: false, type: [String], default: [] },
  logs: { required: false, type: Object, default: null },
});

export default model<GuildModels>("Guild", GuildSchema);

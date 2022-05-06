import { model, Schema } from "mongoose";
import { UserModels } from "@avoid/interfaces";

import config from "@avoid/utils/config";

const UserSchema = new Schema<UserModels>({
  id: { required: true, type: String },
  cmdRunner: { required: false, type: Object, default: null },
  afkData: { required: false, type: Object, default: null },
});

export default model<UserModels>("User", UserSchema);

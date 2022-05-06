import GuildModel from "../database/models/Guild";
import UserModel from "../database/models/User";
import mongoose from "mongoose";
import Client from "../classes/Client";

export class DatabaseService {
  public guild: typeof GuildModel = GuildModel;
  public user: typeof UserModel = UserModel;

  public constructor(protected client: Client) {}

  public async connect(): Promise<void> {
    mongoose.connect(this.client.config.mongo_uri).catch((err) => {
      if (err) {
        this.client.log.error(`Failed connect to database ${err}`);
      }
    });
  }

  public async close(): Promise<void> {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      this.client.log.info("Mongoose connection is closed.");
      process.exit();
    } else {
      this.client.log.error("You can't do that.");
    }
  }
}

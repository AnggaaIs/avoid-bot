import Client from "@avoid/classes/Client";
import Event from "@avoid/classes/Event";
import { Guild } from "discord.js";

export default class GuildDeleteEvent extends Event {
  public constructor(protected client: Client) {
    super(client, {
      name: "guildDelete",
    });
  }

  public async run(guild: Guild): Promise<void> {
    this.client.database.guild.deleteOne({ id: guild.id });
    this.client.log.info(`${guild.name} deleted from database.`);
  }
}

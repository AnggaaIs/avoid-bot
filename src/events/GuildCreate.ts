import Client from "@avoid/classes/Client";
import Event from "@avoid/classes/Event";
import { Guild } from "discord.js";

export default class GuildCreateEvent extends Event {
  public constructor(protected client: Client) {
    super(client, {
      name: "guildCreate",
    });
  }

  public async run(guild: Guild): Promise<void> {
    this.client.database.guild.create({ id: guild.id }).then((data) => {
      if (data) return;
      this.client.log.info(`${guild.name} saved to database.`);
    });
  }
}

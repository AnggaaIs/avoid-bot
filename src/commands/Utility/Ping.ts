import Command from "@avoid/classes/Command";
import CommandContext from "@avoid/classes/CommandContext";
import Client from "@avoid/classes/Client";
import { Message } from "discord.js";

export default class PingCommand extends Command {
  public constructor(protected client: Client) {
    super(client, {
      name: "ping",
      description: "Check bot latency.",
      category: "Utility",
      cooldown: 5,
    });
  }

  public async run(ctx: CommandContext): Promise<Message | void> {
    await this.client.database.guild.deleteOne({ id: ctx.interaction.guildId });
    const wsPing = this.client.ws.ping;
    ctx.sendMessage(
      `🏓 Pong - Roundtrip \`${Math.round(Date.now() - ctx.interaction.createdTimestamp)}ms\`, API \`${wsPing}ms\``
    );
  }
}

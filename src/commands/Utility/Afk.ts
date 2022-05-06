import Command from "@avoid/classes/Command";
import CommandContext from "@avoid/classes/CommandContext";
import Client from "@avoid/classes/Client";
import { Message } from "discord.js";
import { ApplicationCommandOptionTypes } from "discord.js/typings/enums";

export default class AfkCommand extends Command {
  public constructor(protected client: Client) {
    super(client, {
      name: "afk",
      description: "Set afk.",
      category: "Utility",
      cooldown: 15,
      options: [
        {
          name: "reason",
          required: false,
          type: ApplicationCommandOptionTypes.STRING,
          description: "Input reason afk.",
        },
      ],
    });
  }

  public async run(ctx: CommandContext): Promise<Message | void> {
    const user = ctx.interaction.user;
    const reason = ctx.interaction.options.getString("reason") ?? "AFK";
    const userData = await this.client.database.user.findOne({ id: user.id });
    if (userData.afkData) {
      ctx.sendMessage(`:x: | You already afk!`, { ephemeral: true });
      return;
    }

    await userData.updateOne({ afkData: { date: new Date(), reason } });
    ctx.sendMessage(`✅ | <@${user.id}> I set your afk, reason: \`${reason}\``, { timeout: 30000 });
  }
}

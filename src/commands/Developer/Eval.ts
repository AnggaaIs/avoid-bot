import Command from "@avoid/classes/Command";
import CommandContext from "@avoid/classes/CommandContext";
import Client from "@avoid/classes/Client";
import { Message, MessageActionRow, MessageButton } from "discord.js";
import { ApplicationCommandOptionTypes } from "discord.js/typings/enums";
import { inspect } from "util";
import { Colors } from "@avoid/utils/Constants";
import CustomEmbed from "@avoid/classes/CustomEmbed";
import axios from "axios";

export default class EvalCommand extends Command {
  public constructor(protected client: Client) {
    super(client, {
      name: "eval",
      description: "Evaluated javascript code.",
      category: "Developer",
      devOnly: true,
      options: [
        {
          name: "code",
          description: "Input javascript code.",
          required: true,
          type: ApplicationCommandOptionTypes.STRING,
        },
      ],
    });
  }

  public async run(ctx: CommandContext): Promise<Message | void> {
    try {
      await ctx.interaction.deferReply();
      const code = ctx.interaction.options.getString("code");
      const user = ctx.interaction.user;

      const evaluated = eval(code);
      const res = typeof evaluated === "string" ? evaluated : inspect(evaluated);
      const resFilter = res.replace(new RegExp(this.client.config.token, "g"), "HIDDEN");

      if (resFilter.length > 1024) {
        const { data } = await axios.post<any>("https://www.toptal.com/developers/hastebin/documents", resFilter);
        ctx.interaction.followUp(`:white_check_mark: | For security reasons, I sent the link via DM!`);
        setTimeout(() => ctx.interaction.deleteReply().catch(() => {}), 30000);

        const fetchUser = await this.client.users.fetch(user.id);
        fetchUser.send(`:white_check_mark: | https://www.toptal.com/developers/hastebin/${data.key}`);
        return;
      }

      await makeEmbed(ctx, this.client, resFilter, true);
    } catch (err) {
      const config = this.client.config;

      const e = err.stack.replace(new RegExp(config.token, "g"), "HIDDEN");
      await makeEmbed(ctx, this.client, e, false);
    }
  }
}

async function makeEmbed(ctx: CommandContext, client: Client, value: string | any, isSuccess = true): Promise<void> {
  const embed = new CustomEmbed()
    .setAuthor({
      name: `Evaled ${isSuccess ? "Success" : "Failed"}`,
      iconURL: client.user.avatarURL(),
    })
    .setColor(isSuccess ? Colors.general : Colors.error)
    .setThumbnail(client.user.avatarURL())
    .addField("Returned", `\`\`\`js\n${value}\`\`\``)
    .setRequested(ctx.interaction.user)
    .setTimestamp();

  const button = new MessageButton().setCustomId("button_delete").setEmoji("🗑️").setStyle("DANGER");
  const embedButtonComponent = new MessageActionRow().addComponents(button);

  const msg = await ctx.interaction.followUp({ embeds: [embed], components: [embedButtonComponent] });

  const collector = (msg as Message).createMessageComponentCollector();

  collector.on("collect", (interaction) => {
    if (interaction.user.id !== ctx.interaction.user.id) {
      interaction.reply({ content: "This interaction is not for you!", ephemeral: true });
      return;
    }

    if (interaction.customId === "button_delete") {
      collector.stop();
      ctx.interaction.deleteReply();
    }
  });
}

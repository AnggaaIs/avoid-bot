import Command from "../../classes/Command";
import CommandContext from "../../classes/CommandContext";
import Client from "../../classes/Client";
import { Message, MessageActionRow, MessageButton } from "discord.js";
import { ApplicationCommandOptionTypes } from "discord.js/typings/enums";
import { inspect } from "util";
import { toTitleCase } from "../../utils";
import { Colors } from "../../utils/Constants";
import CustomEmbed from "../../classes/CustomEmbed";
import axios from "axios";
import { exec } from "child_process";

export default class ExecCommand extends Command {
  public constructor(protected client: Client) {
    super(client, {
      name: "exec",
      description: "Execute commands.",
      category: "Developer",
      devOnly: true,
      options: [
        {
          name: "code",
          description: "Enter the code to be execute.",
          required: true,
          type: ApplicationCommandOptionTypes.STRING,
        },
      ],
    });
  }

  public async run(ctx: CommandContext): Promise<Message | void> {
    await ctx.interaction.deferReply();
    const code = ctx.interaction.options.getString("code");
    const user = ctx.interaction.user;

    exec(code, async (error, stdout, stderr) => {
      if (stdout.length > 1024) {
        const key = await postHaste(stdout);
        const fetchUser = await this.client.users.fetch(user.id);
        fetchUser.send(`:white_check_mark: | STDOUT | https://www.toptal.com/developers/hastebin/${key}`);
      }

      if (stderr.length > 1024) {
        const key = await postHaste(stderr);
        const fetchUser = await this.client.users.fetch(user.id);
        fetchUser.send(`:white_check_mark: | STDERR | https://www.toptal.com/developers/hastebin/${key}`);
      }

      if (stdout.length > 1024 || stderr.length > 1024) {
        ctx.interaction.followUp(`:white_check_mark: | For security reasons, I sent the link via DM!`);
        setTimeout(() => ctx.interaction.deleteReply().catch(() => {}), 30000);
      } else {
        await makeEmbed(ctx, this.client, stdout, stderr);
      }
    });
  }
}

async function makeEmbed(ctx: CommandContext, client: Client, stdout: string | any, stderr: string | any): Promise<void> {
  const embed = new CustomEmbed()
    .setAuthor({
      name: `Execute`,
      iconURL: client.user.avatarURL(),
    })
    .setColor(Colors.general)
    .setThumbnail(client.user.avatarURL())
    .setRequested(ctx.interaction.user)
    .setTimestamp();

  if (stdout.length) embed.addField("Stdout", `\`\`\`js\n${stdout}\`\`\``);
  if (stderr.length) embed.addField("Stderr", `\`\`\`js\n${stderr}\`\`\``);

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

async function postHaste(val: string): Promise<any> {
  const { data } = await axios.post<any>("https://www.toptal.com/developers/hastebin/documents", val);
  if (data) return data.key;
}

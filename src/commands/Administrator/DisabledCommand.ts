import Command from "../../classes/Command";
import CommandContext from "../../classes/CommandContext";
import Client from "../../classes/Client";
import { Message } from "discord.js";
import { ApplicationCommandOptionTypes } from "discord.js/typings/enums";
import { toTitleCase } from "../../utils";
import { Colors } from "../../utils/Constants";
import CustomEmbed from "../../classes/CustomEmbed";

const ignoredCommand = ["disablecommand", "help"];

export default class DisabledCommandCommand extends Command {
  public constructor(protected client: Client) {
    super(client, {
      name: "disablecommand",
      description: "Add / remove disabled command.",
      category: "Administrator",
      cooldown: 10,
      permissions: {
        user: ["MANAGE_GUILD"],
      },
      options: [
        {
          name: "add",
          type: ApplicationCommandOptionTypes.SUB_COMMAND,
          description: "Add disable command",
          options: [
            {
              name: "command",
              type: ApplicationCommandOptionTypes.STRING,
              description: "Input command name",
              required: true,
            },
          ],
        },
        {
          name: "remove",
          type: ApplicationCommandOptionTypes.SUB_COMMAND,
          description: "Remove disable command",
          options: [
            {
              name: "command",
              type: ApplicationCommandOptionTypes.STRING,
              description: "Input command name",
              required: true,
            },
          ],
        },
        {
          name: "list",
          type: ApplicationCommandOptionTypes.SUB_COMMAND,
          description: "Displays list disabled command.",
        },
      ],
    });
  }

  public async run(ctx: CommandContext): Promise<Message | void> {
    const subCommand = ctx.interaction.options.getSubcommand();
    const guildData = await this.client.database.guild.findOne({ id: ctx.interaction.guildId });

    if (subCommand === "add") {
      const command = ctx.interaction.options.getString("command");
      const cmd = this.client.commands.get(command.toLowerCase());

      if (!cmd) {
        ctx.sendMessage(`:x: | \`${command}\` command not found!`, { ephemeral: true });
        return;
      }

      if (ignoredCommand.includes(command.toLowerCase())) {
        ctx.sendMessage(
          `:x: | So that the bot can function properly, we prevent you from disabling \`${command.toLowerCase()}\` command.`
        );
        return;
      }

      if (guildData.disableCommands?.includes(command.toLowerCase())) {
        ctx.sendMessage(`:x: | \`${command.toLocaleLowerCase()}\`  command has been disabled, you can't do that!`, {
          ephemeral: true,
        });
        return;
      }

      await guildData.updateOne({ $push: { disableCommands: command.toLowerCase() } });
      ctx.sendMessage(`:white_check_mark: | \`${toTitleCase(command.toLowerCase())}\` command succesfully disabled.`);
    } else if (subCommand === "remove") {
      const command = ctx.interaction.options.getString("command");

      if (!guildData.disableCommands?.includes(command.toLowerCase())) {
        ctx.sendMessage(`:x: | \`${command.toLocaleLowerCase()}\` command is not currently disabled.`, {
          ephemeral: true,
        });
        return;
      }

      await guildData.updateOne({ $pull: { disableCommands: command.toLowerCase() } });
      ctx.sendMessage(`:white_check_mark: | \`${toTitleCase(command.toLowerCase())}\` command succesfully enabled.`);
    } else if (subCommand === "list") {
      const disabledCommands = guildData.disableCommands;
      let text = "";

      if (!disabledCommands.length) {
        text = "None";
      } else {
        text = disabledCommands.map((x) => `\`${x}\``).join(", ");
      }

      const embed = new CustomEmbed()
        .setColor(Colors.general)
        .setAuthor({ name: `Disable Commands List | ${ctx.interaction.guild.name}` })
        .setThumbnail(ctx.interaction.guild.iconURL())
        .setDescription(text)
        .setRequested(ctx.interaction.user);

      ctx.sendMessage({ embeds: [embed] });
    }
  }
}

import Command from "@avoid/classes/Command";
import CommandContext from "@avoid/classes/CommandContext";
import Client from "@avoid/classes/Client";
import { EmbedFieldData, Message, MessageActionRow, MessageButton, MessageSelectMenu, MessageSelectOptionData } from "discord.js";
import { ApplicationCommandOptionTypes } from "discord.js/typings/enums";
import { Colors } from "@avoid/utils/Constants";
import CustomEmbed from "@avoid/classes/CustomEmbed";
import { readdirSync } from "fs";
import { join } from "path";
import { toTitleCase } from "@avoid/utils";

export default class HelpCommand extends Command {
  public constructor(protected client: Client) {
    super(client, {
      name: "help",
      description: "Show page help.",
      category: "Utility",
      cooldown: 5,
      options: [
        {
          name: "command",
          description: "Input command name.",
          required: false,
          type: ApplicationCommandOptionTypes.STRING,
        },
      ],
    });
  }

  public async run(ctx: CommandContext): Promise<Message | void> {
    await ctx.interaction.deferReply();
    const commandName = ctx.interaction.options.getString("command");

    if (commandName) {
      const cmd = getCommandByName(commandName, this.client);
      let text = `:x: | No command found with the name \`${commandName}\``;
      if (!cmd) {
        const res = Array.from(this.client.commands.keys())
          .filter((x) => x.includes(commandName))
          .map((x) => `\`${x}\``);

        res.length > 0 ? (text += `\nAre you mean this ? ${res.join(", ")}`) : null;
        ctx.interaction.followUp(text);
        setTimeout(() => ctx.interaction.deleteReply().catch(() => {}), 30000);
        return;
      }

      if (cmd && cmd.category === "Developer") {
        ctx.interaction.followUp(text);
        return;
      }

      const fieldData: EmbedFieldData[] = [];

      const userPerms = cmd.permissions["user"] ?? [];
      const clientPerms = cmd.permissions["client"] ?? [];
      const userPermString = userPerms.map((x) => `**${toTitleCase(x.replace(/_/g, " "))}**`).join(", ");
      const clientPermString = clientPerms.map((x) => `**${toTitleCase(x.replace(/_/g, " "))}**`).join(", ");

      if (cmd.category) fieldData.push({ name: "Category", value: `${cmd.category}` });
      if (cmd.description) fieldData.push({ name: "Description", value: `${cmd.description}` });
      if (userPerms.length > 0 || clientPerms.length > 0) {
        fieldData.push({
          name: "Permissions",
          value: `${clientPerms.length > 0 ? `- Client: ${clientPermString}` : ""}\n${
            userPerms.length > 0 ? `- User: ${userPermString}` : ""
          }`,
        });
      }
      if (cmd.cooldown) fieldData.push({ name: "Cooldown", value: `${cmd.cooldown} seconds` });

      //Dm
      fieldData.push({ name: "Allow DM", value: !cmd.inDm ? "Yes" : "No" });

      const embedHelpA = new CustomEmbed()
        .setColor(Colors.general)
        .setAuthor({
          name: `${toTitleCase(cmd.name)} Command`,
          iconURL: this.client.user.avatarURL(),
        })
        .setThumbnail(this.client.user.avatarURL())
        .addFields(fieldData)
        .setRequested(ctx.interaction.user);

      ctx.interaction.followUp({ embeds: [embedHelpA] });
    } else {
      const text = `> :toolbox: | Utility\n> :shield: | Administrator`;

      const embedHelp = new CustomEmbed()
        .setColor(Colors.general)
        .setAuthor({ name: `${this.client.user.username} Help`, iconURL: this.client.user.displayAvatarURL() })
        .setThumbnail(this.client.user.displayAvatarURL())
        .setDescription(`Below is a command based on category, you can view the command list with the menu below.`)
        .addField("Category", text)
        .setRequested(ctx.interaction.user)
        .setTimestamp();

      const { selectMenuOptionData, category } = readCategory();
      const com = selectMenuOptionData.filter((x: any) => x.label !== "Back");

      const selectMenu = new MessageSelectMenu().setCustomId("select_category").setOptions(com).setPlaceholder("Select category");
      const buttonHelp = new MessageButton().setCustomId("button_help_back").setEmoji("🔙").setLabel("Back").setStyle("PRIMARY");

      const embedHelpSelectMenuComponent = new MessageActionRow().addComponents(selectMenu);
      const embedHelpButtonComponent = new MessageActionRow().addComponents(buttonHelp);

      const msgEmbedHelp = await ctx.interaction.followUp({
        embeds: [embedHelp],
        components: [embedHelpSelectMenuComponent],
      });

      const collector = (msgEmbedHelp as Message).createMessageComponentCollector();

      collector.on("collect", async (interaction) => {
        if (!interaction) return;
        const customId = interaction.customId;

        if (interaction.user.id !== ctx.interaction.user.id) {
          interaction.reply({ content: "This interaction is not for you!", ephemeral: true });
          return;
        }

        if (customId === "select_category") {
          if (!interaction["values"]) return;
          const values = interaction["values"][0];

          category.forEach(async (b: any) => {
            if (values.toLowerCase() === b.toLowerCase()) {
              const category = getCommandsByCategory(values.toLowerCase(), this.client);
              const categoryValue = category.map((x: any) => `\`${x.name}\``).join(", ");

              const embedE = new CustomEmbed()
                .setColor(Colors.general)
                .setAuthor({ name: `${b} Panel`, iconURL: this.client.user.avatarURL() })
                .setThumbnail(this.client.user.avatarURL())
                .addField(`Commands - (${category.size})`, categoryValue)
                .setRequested(ctx.interaction.user);

              await interaction
                .update({ embeds: [embedE], components: [embedHelpSelectMenuComponent, embedHelpButtonComponent] })
                .catch(() => {});
            }
          });
        } else if (customId === "button_help_back") {
          await interaction.update({ embeds: [embedHelp], components: [embedHelpSelectMenuComponent] }).catch(() => {});
        }
      });
    }
  }
}

function readCategory(): any {
  const folder = readdirSync(join(__dirname, "../../commands"));
  const category: string[] = [];
  const selectMenuOptionData: MessageSelectOptionData[] = [];

  folder.forEach((a) => {
    category.push(a);
  });

  for (let i = 0; i < category.length; i++) {
    const data = category[i];

    switch (data) {
      case "Utility":
        selectMenuOptionData.push({
          description: "Showing a list of utility commands.",
          emoji: "🧰",
          label: "Utility",
          value: "utility",
        });
        break;
      case "Administrator":
        selectMenuOptionData.push({
          description: "Showing a list of administrator commands.",
          emoji: "🛡️",
          label: "Administrator",
          value: "administrator",
        });
    }

    selectMenuOptionData.push({
      description: "Return to the main menu.",
      emoji: "🔙",
      label: "Back",
      value: "back",
    });
  }

  return { selectMenuOptionData, category };
}

function getCommandsByCategory(categoryName: string, client: Client): any {
  const command = client.commands.filter((x) => x.category.toLowerCase() === categoryName.toLowerCase());
  return command;
}

function getCommandByName(commandName: string, client: Client): Command {
  const cmd = client.commands.get(commandName);
  if (!cmd) return null;
  return cmd;
}

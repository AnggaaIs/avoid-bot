import Command from "@avoid/classes/Command";
import CommandContext from "@avoid/classes/CommandContext";
import Client from "@avoid/classes/Client";
import { EmbedFieldData, Message, MessageActionRow, MessageButton, MessageSelectMenu, MessageSelectOptionData } from "discord.js";
import CustomEmbed from "@avoid/classes/CustomEmbed";
import { Colors } from "@avoid/utils/Constants";
import axios from "axios";
import { ApplicationCommandOptionTypes } from "discord.js/typings/enums";

const logo = {
  npm: "https://i.ibb.co/5Wfm7xd/1974423.png",
  yarn: "https://yarnpkg.com/icons/icon-512x512.png",
};

export default class NodePackageCommand extends Command {
  public constructor(protected client: Client) {
    super(client, {
      name: "nodepackage",
      description: "Provide information a package node.",
      category: "Utility",
      cooldown: 10,
      options: [
        {
          name: "package",
          description: "Input pacakage name.",
          type: ApplicationCommandOptionTypes.STRING,
          required: true,
        },
        {
          name: "sources",
          description: "Select sources (default npm)",
          type: ApplicationCommandOptionTypes.STRING,
          required: false,
          choices: [
            {
              name: "Npm",
              value: "npm",
            },
            {
              name: "Yarn",
              value: "yarn",
            },
          ],
        },
      ],
    });
  }

  public async run(ctx: CommandContext): Promise<Message | void> {
    try {
      await ctx.interaction.deferReply();
      const packageName = ctx.interaction.options.getString("package");
      const sources = ctx.interaction.options.getString("sources") ?? "npm";
      const isNpm = sources === "npm" ? true : false;

      const r = await makeEmbed(sources as any, ctx, this.client, packageName, true);

      const button: any[] = [];
      const url = `https://${isNpm ? `www.npmjs.com` : "yarnpkg.com/en/package"}/${r.pkgInfo.name}`;
      button.push(new MessageButton().setLabel("Link").setURL(url).setStyle("LINK"));
      if (r.pkgInfo.homepage) {
        button.push(new MessageButton().setLabel("Homepage").setURL(r.pkgInfo.homepage).setStyle("LINK"));
      }

      const opt: MessageSelectOptionData[] = [
        {
          label: "NPM",
          value: "npm",
          emoji: "<:npm:966904153282605116>",
          description: "Npm",
        },
        {
          label: "YARN",
          value: "yarn",
          emoji: "🧶",
          description: "Yarn",
        },
      ];

      opt[isNpm ? 0 : 1].default = true;

      const sel = new MessageSelectMenu().setPlaceholder("Sources").addOptions(opt).setCustomId("select_sources");

      const componentButton = new MessageActionRow().addComponents(button);
      const rowComponent = new MessageActionRow().addComponents(sel);

      const msg = await ctx.interaction.followUp({ embeds: [r.embed], components: [componentButton, rowComponent] });

      const collector = (msg as Message).createMessageComponentCollector();

      collector.on("collect", async (interaction) => {
        if (!interaction) return;

        if (interaction.user.id !== ctx.interaction.user.id) {
          interaction.reply({ content: "This interaction is not for you!", ephemeral: true });
          return;
        }

        if (interaction.customId === "select_sources") {
          if (!interaction["values"]) return;
          const values = interaction["values"][0];
          const sources = ["yarn", "npm"];

          sources.forEach(async (a) => {
            if (values.toLowerCase() === a.toLowerCase()) {
              const isNpm = a.toLowerCase() === "npm" ? true : false;

              const l = await makeEmbed(a as any, ctx, this.client, packageName);
              if (!l) return;
              const url = isNpm ? `www.npmjs.com` : "yarnpkg.com/en/package";
              const button: any[] = [];

              button.push(new MessageButton().setLabel("Link").setURL(`https://${url}/${l.pkgInfo.name}`).setStyle("LINK"));
              if (l.pkgInfo.homepage) {
                button.push(new MessageButton().setLabel("Homepage").setURL(l.pkgInfo.homepage).setStyle("LINK"));
              }

              const componentButton = new MessageActionRow().addComponents(button);

              await interaction.update({ embeds: [l.embed], components: [componentButton, rowComponent] });
            }
          });
        }
      });
    } catch (err) {
      this.client.log.error(err.stack);
    }
  }
}

async function makeEmbed(
  typePkg: "yarn" | "npm",
  ctx: CommandContext,
  client: Client,
  packageName: string,
  send = false
): Promise<any> {
  try {
    const isNpm = typePkg === "npm" ? true : false;
    const type = isNpm ? "npmjs" : "yarnpkg";

    const { data } = await axios.get(`https://registry.${type}.com/${packageName}`);

    const fieldData: EmbedFieldData[] = [];
    const pkgInfo = data.versions[data["dist-tags"].latest];

    fieldData.push({ name: "Name", value: pkgInfo.name });
    if (pkgInfo.author) {
      fieldData.push({ name: "Author", value: pkgInfo.author.name });
    }

    if (pkgInfo.keywords) fieldData.push({ name: "Keywords", value: pkgInfo.keywords.map((x: string) => `**${x}**`).join(", ") });

    fieldData.push({ name: "Version", value: data["dist-tags"].latest });
    if (pkgInfo.maintainers.length > 0) {
      fieldData.push({ name: "Maintainers", value: pkgInfo.maintainers.map((x: any) => `**${x.name}**`).join(", ") });
    }
    fieldData.push({ name: "License", value: pkgInfo.license ?? "Unknown License." });

    if (pkgInfo.dependencies && pkgInfo.dependencies.length > 0) {
      const dependencies = Object.keys(pkgInfo.dependencies).map((x) => `**${x}**`);
      fieldData.push({ name: "Dependencies", value: dependencies.join(", ") });
    }

    if (data.time.created) {
      const date = Math.floor(new Date(data.time.created).getTime() / 1000);
      fieldData.push({ name: "Created Date", value: `<t:${date}:F> (<t:${date}:R>)` });
    }

    if (data.time.modified) {
      const date = Math.floor(new Date(data.time.modified).getTime() / 1000);
      fieldData.push({ name: "Updated Date", value: `<t:${date}:F> (<t:${date}:R>)` });
    }

    const embed = new CustomEmbed()
      .setColor(Colors.general)
      .setAuthor({ name: typePkg.toLocaleUpperCase(), iconURL: client.user.avatarURL() })
      .setThumbnail(typePkg === "npm" ? logo.npm : logo.yarn)
      .setDescription(data.description ?? "No description provided.")
      .addFields(fieldData)
      .setRequested(ctx.interaction.user);

    return { embed, pkgInfo };
  } catch (err) {
    if (send) {
      await ctx.interaction.followUp(
        `${typePkg === "npm" ? "<:npm:966904153282605116>" : "🧶"} | Package \`${packageName}\` not found.`
      );
      setTimeout(() => ctx.interaction.deleteReply().catch(() => {}), 30000);
    }
    this.client.log.error(err);
    return;
  }
}

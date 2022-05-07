import Command from "@avoid/classes/Command";
import CommandContext from "@avoid/classes/CommandContext";
import Client from "@avoid/classes/Client";
import { EmbedFieldData, Message, MessageActionRow, MessageButton, MessageSelectMenu, MessageSelectOptionData } from "discord.js";
import { ApplicationCommandOptionTypes } from "discord.js/typings/enums";

import { Colors } from "@avoid/utils/Constants";
import CustomEmbed from "@avoid/classes/CustomEmbed";

const LogsList = [
  {
    name: "Message Delete",
    status: false,
  },
  {
    name: "Message Update",
    status: false,
  },
  {
    name: "Message Delete Bulk",
    status: false,
  },
];

const getLogsForDefault = async (ctx: CommandContext, client: Client) => {
  await client.database.guild.findOneAndUpdate({ id: ctx.interaction.guildId }, { logs: { list: LogsList.sort() } });

  const guildData = await client.database.guild.findOne({ id: ctx.interaction.guildId });

  return guildData.logs.list;
};

const getAction = async (ctx: CommandContext, client: Client) => {
  const guildData = await client.database.guild.findOne({ id: ctx.interaction.guildId });
  const menu: MessageSelectOptionData[] = [];
  const logsData = guildData.logs;

  if (guildData && logsData?.list) {
    for (let i = 0; i < logsData.list.length; i++) {
      const d = logsData.list[i];
      menu.push({
        label: d.name,
        value: d.name,
      });
    }
  }

  return menu;
};

export default class LogsCommand extends Command {
  public constructor(protected client: Client) {
    super(client, {
      name: "logs",
      description: "Logging",
      category: "Administrator",
      cooldown: 5,
      permissions: {
        user: ["MANAGE_GUILD"],
        client: ["MANAGE_MESSAGES", "MANAGE_GUILD"],
      },
      options: [
        {
          name: "config",
          type: ApplicationCommandOptionTypes.SUB_COMMAND,
          description: "Configuration logs",
        },
      ],
    });
  }

  public async run(ctx: CommandContext): Promise<Message | void> {
    await ctx.interaction.deferReply();
    const guild = ctx.interaction.guild;
    const user = ctx.interaction.user;

    const guildData = await this.client.database.guild.findOne({ id: guild.id });

    let channel;
    const channelId = guildData.logs?.channel;
    if (!channelId) channel = "Not set";
    else
      channel = guild.channels?.cache.get(channelId)?.id
        ? `<#${guild.channels?.cache.get(channelId)?.id}>`
        : "Invalid channel! please switch";

    const logsData = guildData.logs;

    const firstFieldData: EmbedFieldData[] = [];

    if (guildData && !logsData?.list) {
      const logsList = await getLogsForDefault(ctx, this.client);

      for (let i = 0; i < logsList.length; i++) {
        const log = logsList[i];
        firstFieldData.push({ name: log.name, value: `> Status: ${log.status ? "Active" : "Not active"}` });
      }
    } else {
      for (let i = 0; i < logsData.list.length; i++) {
        const log = logsData.list[i];
        firstFieldData.push({ name: log.name, value: `> Status: ${log.status ? "Active" : "Not active"}` });
      }
    }

    const menuList = await getAction(ctx, this.client);

    const buttonForChannel = new MessageButton().setCustomId("button_channel_config").setStyle("PRIMARY").setLabel("Set channel");
    const selectAction = new MessageSelectMenu().setCustomId("select_action").setPlaceholder("Action").setOptions(menuList);

    const row = new MessageActionRow().addComponents(buttonForChannel);
    const rowSelectMenu = new MessageActionRow().addComponents(selectAction);

    const firstEmbed = await makeEmbed(ctx, channel, firstFieldData);

    const firstMsg = await ctx.interaction.followUp({ embeds: [firstEmbed], components: [row, rowSelectMenu] });

    const collectorComponent = (firstMsg as Message).createMessageComponentCollector();

    collectorComponent.on("collect", async (interaction) => {
      const customId = interaction.customId;

      if (interaction.user.id !== ctx.interaction.user.id) {
        interaction.reply({ content: "This interaction is not for you!", ephemeral: true });
        return;
      }

      if (customId === "button_channel_config") {
        const embedConfigChannel = new CustomEmbed()
          .setColor(Colors.general)
          .setAuthor({ name: `Channel Logs Configuration | ${guild.name}`, iconURL: guild.iconURL() })
          .setThumbnail(guild.iconURL())
          .setDescription(
            `Welcome to the Channel Logs configuration, for the channel set, it is enough to mention the channel without any frills.\n\nNb: The message will be deleted automatically in 30 seconds if there is no action anyway!`
          )
          .setRequested(interaction.user)
          .setTimestamp();

        await interaction.update({ embeds: [embedConfigChannel], components: [] });

        const filter = (m: any) => m.author.id === interaction.user.id;
        const collectorMsg = ctx.interaction.channel.createMessageCollector({ filter, time: 30_000 });

        collectorMsg.on("collect", async (msg) => {
          const content = msg.mentions.channels.first();
          if (!content) return;

          const resCh = msg.guild.channels.cache.get(content.id);
          if (!resCh) {
            msg.reply(`:x: | You enter an invalid channel!`).then((m) => {
              setTimeout(() => {
                if (m.deletable) m.delete().catch(() => {});
              }, 10000);
            });
            return;
          }
          const firstFieldData: EmbedFieldData[] = [];

          collectorMsg.stop();

          await this.client.database.guild.findOneAndUpdate({ id: guild.id }, { $set: { "logs.channel": resCh.id } });
          const guildData = await this.client.database.guild.findOne({ id: guild.id });

          const logsData = guildData.logs;

          for (let i = 0; i < logsData.list.length; i++) {
            const log = logsData.list[i];
            firstFieldData.push({ name: log.name, value: `> Status: ${log.status ? "Active" : "Not active"}` });
          }

          let channel;
          const channelId = guildData.logs?.channel;
          if (!channelId) channel = "Not set";
          else
            channel = guild.channels?.cache.get(channelId)?.id
              ? `<#${guild.channels?.cache.get(channelId)?.id}>`
              : "Invalid channel! please switch";

          const e = await makeEmbed(ctx, channel, firstFieldData);

          await interaction.editReply({ embeds: [e], components: [row, rowSelectMenu] });
        });
      } else if (customId === "select_action") {
        const values = interaction["values"][0];
        const guildData = await this.client.database.guild.findOne({ id: guild.id });

        LogsList.forEach(async (a) => {
          if (values === a.name) {
            const guildData1 = await this.client.database.guild.findOne({ id: guild.id });
            const actionData = guildData1.logs.list.find((x) => x.name === values);

            await this.client.database.guild.findOneAndUpdate(
              { id: guild.id, "logs.list.name": values },
              { $set: { "logs.list.$.status": !actionData.status } }
            );

            const firstFieldData: EmbedFieldData[] = [];

            const guildData2 = await this.client.database.guild.findOne({ id: guild.id });
            const logsData = guildData2.logs;

            for (let i = 0; i < logsData.list.length; i++) {
              const log = logsData.list[i];
              firstFieldData.push({ name: log.name, value: `> Status: ${log.status ? "Active" : "Not active"}` });
            }

            let channel;
            const channelId = guildData2.logs?.channel;
            if (!channelId) channel = "Not set";
            else
              channel = guild.channels?.cache.get(channelId)?.id
                ? `<#${guild.channels?.cache.get(channelId)?.id}>`
                : "Invalid channel! please switch";

            const e = await makeEmbed(ctx, channel, firstFieldData);

            await interaction.update({ embeds: [e], components: [row, rowSelectMenu] });

            if (channel === "Not set") {
              await interaction.channel
                .send({ content: `:x: | **${interaction.user.tag}**, You need to set a channel first!` })
                .then((m) => {
                  setTimeout(() => {
                    if (m.deletable) m.delete().catch(() => {});
                  }, 15000);
                });
            } else if (channel === "Invalid channel! please switch") {
              await interaction.channel
                .send({
                  content: `:x: | **${interaction.user.tag}**, Channel is currently invalid, please change it first!`,
                })
                .then((m) => {
                  setTimeout(() => {
                    if (m.deletable) m.delete().catch(() => {});
                  }, 15000);
                });
            }
          }
        });
      }
    });
  }
}

async function makeEmbed(ctx: CommandContext, channel: string, firstFieldData: EmbedFieldData[]): Promise<CustomEmbed> {
  const guild = ctx.interaction.guild;
  const user = ctx.interaction.user;

  const firstEmbed = new CustomEmbed()
    .setColor(Colors.general)
    .setAuthor({ name: `Logs Configuration | ${guild.name}`, iconURL: guild.iconURL() })
    .setThumbnail(guild.iconURL())
    .addField("Channel", channel)
    .addFields(firstFieldData)
    .setRequested(user);

  return firstEmbed;
}

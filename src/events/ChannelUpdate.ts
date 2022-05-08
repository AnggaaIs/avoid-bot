import Client from "@avoid/classes/Client";
import CustomEmbed from "@avoid/classes/CustomEmbed";
import Event from "@avoid/classes/Event";
import { toTitleCase } from "@avoid/utils";
import { Colors } from "@avoid/utils/Constants";
import { EmbedFieldData, Message, NonThreadGuildBasedChannel, TextChannel } from "discord.js";
import humanizeDuration from "humanize-duration";

export default class ChannelUpdateEvent extends Event {
  public constructor(protected client: Client) {
    super(client, {
      name: "channelUpdate",
    });
  }

  public async run(oldChannel: NonThreadGuildBasedChannel, newChannel: NonThreadGuildBasedChannel): Promise<void | Message> {
    const oldName = oldChannel.name;
    const newName = newChannel.name;
    let topicOld = oldChannel["topic"];
    let topicNew = newChannel["topic"];
    const nsfwOld = oldChannel["nsfw"];
    const nsfwNew = newChannel["nsfw"];
    const slowmodeOld = oldChannel["rateLimitPerUser"] === 0 ? "None" : humanizeDuration(oldChannel["rateLimitPerUser"] * 1000);
    const slowmodeNew = newChannel["rateLimitPerUser"] === 0 ? "None" : humanizeDuration(newChannel["rateLimitPerUser"] * 1000);
    const autoArchiveOld =
      oldChannel["defaultAutoArchiveDuration"] === 0
        ? "None"
        : humanizeDuration(oldChannel["defaultAutoArchiveDuration"] * 60000);
    const autoArchiveNew =
      newChannel["defaultAutoArchiveDuration"] === 0
        ? "None"
        : humanizeDuration(newChannel["defaultAutoArchiveDuration"] * 60000);
    const guild = newChannel.guild;
    let typeOld = toTitleCase(oldChannel.type.replace("GUILD_", ""));
    let typeNew = toTitleCase(newChannel.type.replace("GUILD_", ""));

    const guildData = await this.client.database.guild.findOne({ id: guild.id });
    if (guildData && !guildData.logs) return;
    if (!guildData.logs?.channel) return;
    if (!guildData.logs?.list) return;

    const eventData = guildData.logs.list.find((x) => x.name === "Channel Update");
    if (!eventData.status) return;

    const fieldData: EmbedFieldData[] = [];

    if (oldName !== newName) {
      fieldData.push({ name: "Name Before", value: `${oldName}` });
      fieldData.push({ name: "Name After", value: `${newName}` });
    }

    if (topicOld !== topicNew) {
      if (topicOld.length > 1015) {
        topicOld = topicOld.substring(0, 1015) + "....";
      }
      if (topicNew.length > 1015) {
        topicNew = topicNew.substring(0, 1015) + "....";
      }

      fieldData.push({ name: "Topic Before", value: `${topicOld ?? "None"}` });
      fieldData.push({ name: "Topic After", value: `${topicNew ?? "None"}` });
    }

    if (nsfwOld !== nsfwNew) {
      fieldData.push({ name: "NSFW Before", value: `**${nsfwOld ? "Yes" : "No"}**` });
      fieldData.push({ name: "NSFW After", value: `**${nsfwNew ? "Yes" : "No"}**` });
    }

    if (slowmodeOld !== slowmodeNew) {
      fieldData.push({ name: "Slowmode Before", value: `${slowmodeOld}` });
      fieldData.push({ name: "Slowmode After", value: `${slowmodeNew}` });
    }

    if (typeOld !== typeNew) {
      if (typeOld === "News") typeOld = "News (Announcement)";
      if (typeNew === "News") typeNew = "News (Announcement)";

      fieldData.push({ name: "Type Before", value: `${typeOld}` });
      fieldData.push({ name: "Type After", value: `${typeNew}` });
    }

    if (autoArchiveOld !== autoArchiveNew) {
      fieldData.push({ name: "Auto Archive Before", value: `${autoArchiveOld}` });
      fieldData.push({ name: "Auto Archive After", value: `${autoArchiveNew}` });
    }

    if (!fieldData.length || fieldData.length === 0) return;

    const embed = new CustomEmbed()
      .setColor(Colors.general)
      .setAuthor({ name: guild.name, iconURL: guild.iconURL() })
      .setThumbnail(guild.iconURL())
      .setDescription(`Channel Updated: <#${newChannel.id}>`)
      .setFields(fieldData)
      .setTimestamp()
      .setFooter({ text: `ID: ${newChannel.id}` });

    const channels = guild.channels.cache.get(guildData.logs?.channel) as TextChannel;
    if (!channels) return;
    channels.send({ embeds: [embed] }).catch(() => {});
  }
}

import Client from "@avoid/classes/Client";
import CustomEmbed from "@avoid/classes/CustomEmbed";
import Event from "@avoid/classes/Event";
import { Colors } from "@avoid/utils/Constants";
import { EmbedFieldData, Message, TextChannel, ThreadChannel } from "discord.js";
import humanizeDuration from "humanize-duration";

export default class ThreadUpdateEvent extends Event {
  public constructor(protected client: Client) {
    super(client, {
      name: "threadUpdate",
    });
  }

  public async run(oldThread: ThreadChannel, newThread: ThreadChannel): Promise<void | Message> {
    const guild = newThread.guild;
    const owner = await this.client.users.fetch(newThread.ownerId);
    const oldThreadName = oldThread.name;
    const newThreadName = newThread.name;
    const autoArchiveOld =
      (oldThread["autoArchiveDuration"] as number) === 0
        ? "None"
        : humanizeDuration((oldThread["autoArchiveDuration"] as number) * 60000);
    const autoArchiveNew =
      (newThread["autoArchiveDuration"] as number) === 0
        ? "None"
        : humanizeDuration((newThread["autoArchiveDuration"] as number) * 60000);
    const slowmodeOld = oldThread["rateLimitPerUser"] === 0 ? "None" : humanizeDuration(oldThread["rateLimitPerUser"] * 1000);
    const slowmodeNew = newThread["rateLimitPerUser"] === 0 ? "None" : humanizeDuration(newThread["rateLimitPerUser"] * 1000);

    const fieldData: EmbedFieldData[] = [];

    if (oldThreadName !== newThreadName) {
      fieldData.push({ name: "Name Before", value: `${oldThreadName}` });
      fieldData.push({ name: "Name After", value: `${newThreadName}` });
    }

    if (autoArchiveOld !== autoArchiveNew) {
      fieldData.push({ name: "Auto Archive Before", value: `${autoArchiveOld}` });
      fieldData.push({ name: "Auto Archive After", value: `${autoArchiveNew}` });
    }

    if (slowmodeOld !== slowmodeNew) {
      fieldData.push({ name: "Slowmode Before", value: `${slowmodeOld}` });
      fieldData.push({ name: "Slowmode After", value: `${slowmodeNew}` });
    }

    const guildData = await this.client.database.guild.findOne({ id: guild.id });
    if (guildData && !guildData.logs) return;
    if (!guildData.logs?.channel) return;
    if (!guildData.logs?.list) return;

    const eventData = guildData.logs.list.find((x) => x.name === "Thread Update");
    if (!eventData.status) return;

    const embed = new CustomEmbed()
      .setColor(Colors.general)
      .setAuthor({ name: guild.name, iconURL: guild.iconURL() })
      .setDescription(`Thread Updated: <#${newThread.id}>`)
      .addFields(fieldData)
      .setTimestamp()
      .setFooter({ text: `ID: ${newThread.id}` });

    const channel = guild.channels.cache.get(guildData.logs?.channel) as TextChannel;
    if (!channel) return;
    channel.send({ embeds: [embed] }).catch(() => {});
  }
}

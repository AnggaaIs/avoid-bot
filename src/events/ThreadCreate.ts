import Client from "@avoid/classes/Client";
import CustomEmbed from "@avoid/classes/CustomEmbed";
import Event from "@avoid/classes/Event";
import { Colors } from "@avoid/utils/Constants";
import { Message, TextChannel, ThreadChannel } from "discord.js";

export default class ThreadCreateEvent extends Event {
  public constructor(protected client: Client) {
    super(client, {
      name: "threadCreate",
    });
  }

  public async run(thread: ThreadChannel): Promise<void | Message> {
    const guild = thread.guild;
    const owner = await this.client.users.fetch(thread.ownerId);
    const threadName = thread.name;
    const threadId = thread.id;

    const guildData = await this.client.database.guild.findOne({ id: guild.id });
    if (guildData && !guildData.logs) return;
    if (!guildData.logs?.channel) return;
    if (!guildData.logs?.list) return;

    const eventData = guildData.logs.list.find((x) => x.name === "Thread Create");
    if (!eventData.status) return;

    const embed = new CustomEmbed()
      .setColor(Colors.general)
      .setAuthor({ name: guild.name, iconURL: guild.iconURL() })
      .setDescription(`Thread Created: <#${threadId}>`)
      .addField("Thread Name", threadName)
      .addField("Owner", `<@${owner.id}>`)
      .setTimestamp()
      .setFooter({ text: `ID: ${threadId}` });

    const channel = guild.channels.cache.get(guildData.logs?.channel) as TextChannel;
    if (!channel) return;
    channel.send({ embeds: [embed] }).catch(() => {});
  }
}

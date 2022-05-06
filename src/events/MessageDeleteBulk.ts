import { Collection, Message, TextChannel } from "discord.js";
import Client from "@avoid/classes/Client";
import Event from "@avoid/classes/Event";
import { Colors } from "@avoid/utils/Constants";
import CustomEmbed from "@avoid/classes/CustomEmbed";

export default class MessageDeleteBulkEvent extends Event {
  public constructor(protected client: Client) {
    super(client, {
      name: "messageDeleteBulk",
    });
  }

  public async run(msg: Collection<string, Message>): Promise<void | Message> {
    const messagesLength = msg.size;
    const channel = msg.first()?.channel as TextChannel;
    const guild = channel.guild;

    if (!messagesLength) return;
    if (!channel) return;

    const guildData = await this.client.database.guild.findOne({ id: guild.id });
    if (guildData && !guildData.logs) return;
    if (!guildData.logs?.channel) return;
    if (!guildData.logs?.list) return;

    const eventData = guildData.logs.list.find((x) => x.name === "Message Delete Bulk");
    if (!eventData.status) return;

    const embed = new CustomEmbed()
      .setColor(Colors.general)
      .setAuthor({ name: "Message Delete Bulk" })
      .setThumbnail(guild.iconURL())
      .setDescription(`${messagesLength} messages deleted in channel <#${channel.id}>`)
      .setTimestamp()
      .setFooter({ text: `${guild.name} | ${guild.id}` });

    const channels = guild.channels.cache.get(guildData.logs?.channel) as TextChannel;
    if (!channels) return;
    channels.send({ embeds: [embed] }).catch(() => {});
  }
}

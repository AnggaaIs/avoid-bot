import { Message, TextChannel } from "discord.js";
import Client from "@avoid/classes/Client";
import Event from "@avoid/classes/Event";
import { Colors } from "@avoid/utils/Constants";
import CustomEmbed from "@avoid/classes/CustomEmbed";

export default class MessageUpdateEvent extends Event {
  public constructor(protected client: Client) {
    super(client, {
      name: "messageUpdate",
    });
  }

  public async run(oldMessage: Message, newMessage: Message): Promise<void | Message> {
    let oContent = oldMessage.content;
    let nContent = newMessage.content;
    const nAuthor = newMessage.author;
    const nChannel = newMessage.channel;
    const nLink = newMessage.url;
    const nUpdateDate = Math.floor(newMessage.editedTimestamp / 1000);
    const guild = oldMessage.guild;

    if (!oContent || !nContent) return;
    if (typeof oContent !== "string" || typeof nContent !== "string") return;

    const guildData = await this.client.database.guild.findOne({ id: guild.id });
    if (guildData && !guildData.logs) return;
    if (!guildData.logs?.channel) return;
    if (!guildData.logs?.list) return;

    const eventData = guildData.logs.list.find((x) => x.name === "Message Update");
    if (!eventData.status) return;

    if (oContent.length > 1015) {
      oContent = oContent.substring(0, 1015) + "....";
    }

    if (nContent.length > 1015) {
      nContent = nContent.substring(0, 1015) + "....";
    }

    const embed = new CustomEmbed()
      .setColor(Colors.general)
      .setAuthor({ name: "Message Updated", iconURL: nAuthor.avatarURL() })
      .setThumbnail(nAuthor.displayAvatarURL())
      .setDescription(`[Message Link](${nLink})`)
      .addField("Updated in", `${nChannel}`)
      .addField("Updated by", `${nAuthor} | \`${nAuthor.tag}\``)
      .addField("Updated Date", `<t:${nUpdateDate}:F> (<t:${nUpdateDate}:R>)`)
      .addField("Old message", oContent)
      .addField("New message", nContent)
      .setTimestamp();

    const channels = guild.channels.cache.get(guildData.logs?.channel) as TextChannel;
    if (!channels) return;
    channels.send({ embeds: [embed] }).catch(() => {});
  }
}

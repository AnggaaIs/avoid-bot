import { Message, TextChannel } from "discord.js";
import Client from "../classes/Client";
import Event from "../classes/Event";
import { toTitleCase } from "../utils";
import { Colors } from "../utils/Constants";
import CustomEmbed from "../classes/CustomEmbed";

export default class MessageDeleteEvent extends Event {
  public constructor(protected client: Client) {
    super(client, {
      name: "messageDelete",
    });
  }

  public async run(msg: Message): Promise<void | Message> {
    const content = msg.content;
    const author = msg.author;
    const channel = msg.channel;
    const msgTimestamp = msg.createdTimestamp;
    const msgDate = Math.floor(msgTimestamp / 1000);
    const guild = msg.guild;
    if (!content) return;
    if (typeof content !== "string") return;

    const guildData = await this.client.database.guild.findOne({ id: guild.id });
    if (guildData && !guildData.logs) return;
    if (!guildData.logs?.channel) return;
    if (!guildData.logs?.list) return;

    const eventData = guildData.logs.list.find((x) => x.name === "Message Delete");
    if (!eventData.status) return;

    const embed = new CustomEmbed()
      .setColor(Colors.general)
      .setAuthor({ name: "Message Deleted", iconURL: author.avatarURL() })
      .setThumbnail(author.displayAvatarURL())
      .setDescription(content)
      .addField("User", `${author} | \`${author.tag}\``)
      .addField("Channel", `${channel}`)
      .addField("Message Date", `<t:${msgDate}:F> (<t:${msgDate}:R>)`)
      .setTimestamp();

    const channels = guild.channels.cache.get(guildData.logs?.channel) as TextChannel;
    if (!channels) return;
    channels.send({ embeds: [embed] }).catch(() => {});
  }
}

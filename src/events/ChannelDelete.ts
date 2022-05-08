import Client from "@avoid/classes/Client";
import CustomEmbed from "@avoid/classes/CustomEmbed";
import Event from "@avoid/classes/Event";
import { toTitleCase } from "@avoid/utils";
import { Colors } from "@avoid/utils/Constants";
import { Message, NonThreadGuildBasedChannel, TextChannel } from "discord.js";

export default class ChannelDeleteEvent extends Event {
  public constructor(protected client: Client) {
    super(client, {
      name: "channelDelete",
    });
  }

  public async run(channel: NonThreadGuildBasedChannel): Promise<void | Message> {
    const name = channel.name;
    let type = toTitleCase(channel.type.replace("GUILD_", ""));
    const guild = channel.guild;
    if (type === "Stage_voice") type = "Stage";
    if (type === "News") type = "News (Announcement)";

    const guildData = await this.client.database.guild.findOne({ id: guild.id });
    if (guildData && !guildData.logs) return;
    if (!guildData.logs?.channel) return;
    if (!guildData.logs?.list) return;

    const eventData = guildData.logs.list.find((x) => x.name === "Channel Delete");
    if (!eventData.status) return;

    const embed = new CustomEmbed()
      .setColor(Colors.error)
      .setAuthor({ name: guild.name, iconURL: guild.iconURL() })
      .setThumbnail(guild.iconURL())
      .setDescription(`Channel Deleted: **${name}**\nType: **${type}**`)
      .setTimestamp()
      .setFooter({ text: `ID: ${channel.id}` });

    const channels = guild.channels.cache.get(guildData.logs?.channel) as TextChannel;
    if (!channels) return;
    channels.send({ embeds: [embed] }).catch(() => {});
  }
}

import Client from "@avoid/classes/Client";
import CustomEmbed from "@avoid/classes/CustomEmbed";
import Event from "@avoid/classes/Event";
import { Colors } from "@avoid/utils/Constants";
import { GuildMember, Message, TextChannel } from "discord.js";

export default class GuildMemberRemoveEvent extends Event {
  public constructor(protected client: Client) {
    super(client, {
      name: "guildMemberRemove",
    });
  }

  public async run(member: GuildMember): Promise<void | Message> {
    const guild = member.guild;
    const user = member.user;

    const guildData = await this.client.database.guild.findOne({ id: guild.id });
    if (guildData && !guildData.logs) return;
    if (!guildData.logs?.channel) return;
    if (!guildData.logs?.list) return;

    const eventData = guildData.logs.list.find((x) => x.name === "Member Leave");
    if (!eventData.status) return;

    const joinedDate = Math.floor(new Date(member.joinedAt).getTime() / 1000);

    const embed = new CustomEmbed()
      .setColor(Colors.general)
      .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
      .setThumbnail(user.displayAvatarURL())
      .setDescription(`📤 <@${user.id}> left this server.`)
      .addField("Joined Date", `<t:${joinedDate}> (<t:${joinedDate}:R>)`)
      .setTimestamp()
      .setFooter({ text: `ID: ${user.id}` });

    const channel = guild.channels.cache.get(guildData.logs?.channel) as TextChannel;
    if (!channel) return;
    channel.send({ embeds: [embed] }).catch(() => {});
  }
}

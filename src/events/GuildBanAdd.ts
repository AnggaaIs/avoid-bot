import Client from "@avoid/classes/Client";
import CustomEmbed from "@avoid/classes/CustomEmbed";
import Event from "@avoid/classes/Event";
import { Colors } from "@avoid/utils/Constants";
import { GuildBan, Message, TextChannel } from "discord.js";

export default class GuildBanAddEvent extends Event {
  public constructor(protected client: Client) {
    super(client, {
      name: "guildBanAdd",
    });
  }

  public async run(ban: GuildBan): Promise<void | Message> {
    const guild = ban.guild;
    const userBan = ban.user;

    const guildData = await this.client.database.guild.findOne({ id: guild.id });
    if (guildData && !guildData.logs) return;
    if (!guildData.logs?.channel) return;
    if (!guildData.logs?.list) return;

    const eventData = guildData.logs.list.find((x) => x.name === "Guild Ban Add");
    if (!eventData.status) return;

    const embed = new CustomEmbed()
      .setColor(Colors.error)
      .setAuthor({ name: "Member Banned", iconURL: userBan.displayAvatarURL() })
      .setThumbnail(userBan.displayAvatarURL())
      .setDescription(`**${userBan.tag}** has been banned from ${guild.name}`)
      .setTimestamp()
      .setFooter({ text: `ID: ${userBan.id}` });

    const channel = guild.channels.cache.get(guildData.logs?.channel) as TextChannel;
    if (!channel) return;
    channel.send({ embeds: [embed] }).catch(() => {});
  }
}

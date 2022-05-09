import Client from "@avoid/classes/Client";
import CustomEmbed from "@avoid/classes/CustomEmbed";
import Event from "@avoid/classes/Event";
import { Colors } from "@avoid/utils/Constants";
import { EmbedFieldData, GuildMember, Message, TextChannel } from "discord.js";

export default class GuildMemberUpdateEvent extends Event {
  public constructor(protected client: Client) {
    super(client, {
      name: "guildMemberUpdate",
    });
  }

  public async run(oldMember: GuildMember, newMember: GuildMember): Promise<void | Message> {
    const guild = newMember.guild;
    const oldNickname = oldMember.nickname ?? "None";
    const newNickname = newMember.nickname ?? "None";
    const oldAvatar = oldMember.avatarURL();
    const newAvatar = newMember.avatarURL();

    const guildData = await this.client.database.guild.findOne({ id: guild.id });
    if (guildData && !guildData.logs) return;
    if (!guildData.logs?.channel) return;
    if (!guildData.logs?.list) return;

    const eventData = guildData.logs.list.find((x) => x.name === "Member Update");
    if (!eventData.status) return;

    const fieldData: EmbedFieldData[] = [];

    if (oldNickname !== newNickname) {
      fieldData.push({ name: "Nickname Changed", value: `**Before**: ${oldNickname}\n**After**: ${newNickname}` });
    }

    if (oldAvatar !== newAvatar) {
      fieldData.push({
        name: "Guild Avatar Changed",
        value: `**Before**: [Avatar Link](${oldAvatar})\n**After**: [Avatar Link](${newAvatar})`,
      });
    }
    const embed = new CustomEmbed()
      .setColor(Colors.general)
      .setAuthor({ name: newMember.user.tag, iconURL: newMember.user.displayAvatarURL() })
      .addFields(fieldData)
      .setTimestamp()
      .setFooter({ text: `ID: ${newMember.user.id}` });

    const channel = guild.channels.cache.get(guildData.logs?.channel) as TextChannel;
    if (!channel) return;
    channel.send({ embeds: [embed] }).catch(() => {});
  }
}

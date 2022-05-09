import Client from "@avoid/classes/Client";
import CustomEmbed from "@avoid/classes/CustomEmbed";
import Event from "@avoid/classes/Event";
import { Colors } from "@avoid/utils/Constants";
import { Message, TextChannel, VoiceState } from "discord.js";

export default class VoiceStateUpdateEvent extends Event {
  public constructor(protected client: Client) {
    super(client, {
      name: "voiceStateUpdate",
    });
  }

  public async run(oldState: VoiceState, newState: VoiceState): Promise<void | Message> {
    const guild = newState.guild ?? oldState.guild;
    const member = newState.member ?? oldState.member;

    const guildData = await this.client.database.guild.findOne({ id: guild.id });
    if (guildData && !guildData.logs) return;
    if (!guildData.logs?.channel) return;
    if (!guildData.logs?.list) return;

    if (newState.channelId && !oldState.channelId) {
      const eventData = guildData.logs.list.find((x) => x.name === "Voice Channel Join");
      if (!eventData.status) return;

      const embed = new CustomEmbed()
        .setColor(Colors.general)
        .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
        .setDescription(`📥 Joined Voice Channel: **${newState.channel?.name}**`)
        .setTimestamp()
        .setFooter({ text: `ID: ${member.id}` });

      const channels = guild.channels.cache.get(guildData.logs?.channel) as TextChannel;
      if (!channels) return;
      channels.send({ embeds: [embed] }).catch(() => {});
    } else if (oldState.channelId && !newState.channelId) {
      const eventData = guildData.logs.list.find((x) => x.name === "Voice Channel Leave");
      if (!eventData.status) return;

      const embed = new CustomEmbed()
        .setColor(Colors.error)
        .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
        .setDescription(`📤 Left Voice Channel: **${oldState.channel?.name}**`)
        .setTimestamp()
        .setFooter({ text: `ID: ${member.id}` });

      const channels = guild.channels.cache.get(guildData.logs?.channel) as TextChannel;
      if (!channels) return;
      channels.send({ embeds: [embed] }).catch(() => {});
    } else if (oldState.channelId !== newState.channelId) {
      const eventData = guildData.logs.list.find((x) => x.name === "Voice Channel Switch");
      if (!eventData.status) return;

      const embed = new CustomEmbed()
        .setColor(Colors.general)
        .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
        .setDescription(`♻️ Switched Voice Channel: **${oldState.channel?.name}** -> **${newState.channel?.name}**`)
        .setTimestamp()
        .setFooter({ text: `ID: ${member.id}` });

      const channels = guild.channels.cache.get(guildData.logs?.channel) as TextChannel;
      if (!channels) return;
      channels.send({ embeds: [embed] }).catch(() => {});
    }
  }
}

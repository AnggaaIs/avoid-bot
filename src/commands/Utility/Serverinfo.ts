import Command from "@avoid/classes/Command";
import CommandContext from "@avoid/classes/CommandContext";
import Client from "@avoid/classes/Client";
import { EmbedFieldData, Message } from "discord.js";
import { Colors, PremiumGuildLevel } from "@avoid/utils/Constants";
import { toTitleCase } from "@avoid/utils";
import CustomEmbed from "@avoid/classes/CustomEmbed";

export default class ServerInfoCommand extends Command {
  public constructor(protected client: Client) {
    super(client, {
      name: "serverinfo",
      description: "Providing server information.",
      category: "Utility",
      cooldown: 5,
    });
  }

  public async run(ctx: CommandContext): Promise<Message | void> {
    await ctx.interaction.deferReply();
    const guild = ctx.interaction.guild;
    let fieldData: EmbedFieldData[] = [];
    const guildOwner = await this.client.users.fetch(guild.ownerId);

    if (guild.id) fieldData.push({ name: "ID", value: guild.id });
    if (guild.ownerId) fieldData.push({ name: "Owner", value: `<@${guildOwner.id}>` });
    if (guild.createdAt) {
      const date = Math.floor(guild.createdTimestamp / 1000);
      fieldData.push({ name: "Created Date", value: `<t:${date}:F> (<t:${date}:R>)` });
    }
    //Premium (boost)
    fieldData.push({
      name: "Boosts",
      value: `Level: ${PremiumGuildLevel[guild.premiumTier]} (${guild.premiumSubscriptionCount} boost)`,
    });

    const guildFeatures = guild.features;
    if (guildFeatures.length > 0) {
      const feature = guild.features
        .sort()
        .map((x) => `${toTitleCase(x.replace(/_/g, " "))}`)
        .join(", ");

      fieldData.push({ name: "Features", value: feature });
    }

    if (guild.members) {
      const memberHuman = guild.members.cache.filter((a) => !a.user.bot);
      const memberBot = guild.members.cache.filter((a) => a.user.bot);

      fieldData.push({ name: `Members (${guild.memberCount})`, value: `Human: ${memberHuman.size}\nBot: ${memberBot.size}` });
    }
    if (guild.channels.cache.size > 0) {
      const category = guild.channels.cache.filter((ch) => ch.type === "GUILD_CATEGORY");
      const textChannel = guild.channels.cache.filter((ch) => ch.type === "GUILD_TEXT");
      const voiceChannel = guild.channels.cache.filter((ch) => ch.type === "GUILD_VOICE");

      fieldData.push({
        name: `Channels (${guild.channels.cache.size})`,
        value: `Category: ${category.size}\nText: ${textChannel.size}\nVoice: ${voiceChannel.size}`,
      });
    }
    if (guild.roles.cache.size > 0) {
      fieldData.push({ name: `Roles`, value: guild.roles.cache.size.toString() });
    }

    if (guild.emojis.cache.size > 0) {
      const emojiAnimated = guild.emojis.cache.filter((x) => x.animated);
      const emojiRegular = guild.emojis.cache.filter((x) => !x.animated);

      fieldData.push({
        name: `Emojis (${guild.emojis.cache.size})`,
        value: `Animated: ${emojiAnimated.size}\nRegular: ${emojiRegular.size}`,
      });
    }

    const embed = new CustomEmbed()
      .setColor(Colors.general)
      .setAuthor({ name: guild.name, iconURL: guild.iconURL() })
      .setThumbnail(guild.iconURL())
      .addFields(fieldData)
      .setRequested(ctx.interaction.user)
      .setTimestamp();

    ctx.interaction.followUp({ embeds: [embed] });
  }
}

import Command from "@avoid/classes/Command";
import CommandContext from "@avoid/classes/CommandContext";
import Client from "@avoid/classes/Client";
import { ColorResolvable, EmbedFieldData, Message, User } from "discord.js";
import { ApplicationCommandOptionTypes } from "discord.js/typings/enums";
import { Colors, UserFlagEmojis } from "@avoid/utils/Constants";
import { toTitleCase } from "@avoid/utils";
import CustomEmbed from "@avoid/classes/CustomEmbed";

export default class UserInfoCommand extends Command {
  public constructor(protected client: Client) {
    super(client, {
      name: "userinfo",
      description: "Providing user information.",
      category: "Utility",
      cooldown: 5,
      options: [
        {
          name: "user",
          type: ApplicationCommandOptionTypes.USER,
          required: false,
          description: "User input.",
        },
      ],
    });
  }

  public async run(ctx: CommandContext): Promise<Message | void> {
    await ctx.interaction.deferReply();
    const user: User = ctx.interaction.options.getUser("user") ?? ctx.interaction.user;
    let fieldData: EmbedFieldData[] = [];

    if (user.id) fieldData.push({ name: "ID", value: user.id });
    if (user.createdAt) {
      const date = Math.floor(user.createdTimestamp / 1000);
      fieldData.push({ name: "Created Date", value: `<t:${date}:F> (<t:${date}:R>)` });
    }

    const flags = user.flags.toArray();
    if (flags.length > 0) {
      const fl = flags
        .map((x) => `${UserFlagEmojis[toTitleCase(x.replace(/_/g, " "))]} ${toTitleCase(x.replace(/_/g, " "))}`)
        .join(", ");

      fieldData.push({ name: `Flags (${flags.length})`, value: fl });
    }

    let color: ColorResolvable = null;
    if (ctx.interaction.inGuild) {
      const member = ctx.interaction.guild.members.cache.get(user.id);
      color = member.roles.highest.hexColor as ColorResolvable;
      let roles: any;
      fieldData.push({ name: "Nickname", value: member.nickname ?? "None" });
      fieldData.push({ name: "Server Boost", value: member.premiumSince ? "Yes" : "No" });

      if (member.joinedAt) {
        const date = Math.floor(member.joinedTimestamp / 1000);
        fieldData.push({ name: "Join Date", value: `<t:${date}:F> (<t:${date}:R>)` });
      }

      roles = member.roles.cache.map((x) => x).join(", ");
      if (!roles) roles = "None";
      fieldData.push({ name: `Roles (${member.roles.cache.size})`, value: roles });

      const permsList = member.permissions.serialize();
      Object.keys(permsList).forEach((a) => {
        if (!permsList[a]) delete permsList[a];
      });

      fieldData.push({
        name: "Permissions",
        value: Object.keys(permsList)
          .sort()
          .map((perm) => `${toTitleCase(perm.replace(/_/g, " "))}`)
          .join(", "),
      });
    }
    const embed = new CustomEmbed()
      .setColor(color !== "#000000" ? color : Colors.general)
      .setAuthor({ name: `${user.tag}`, iconURL: user.displayAvatarURL() })
      .setThumbnail(user.displayAvatarURL())
      .setDescription(`<@${user.id}>`)
      .addFields(fieldData)
      .setRequested(ctx.interaction.user)
      .setTimestamp();

    ctx.interaction.followUp({ embeds: [embed] });
  }
}

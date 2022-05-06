import { MessageEmbed, MessageEmbedOptions, User } from "discord.js";

export default class Embed extends MessageEmbed {
  public constructor(options?: MessageEmbedOptions) {
    super(options);
  }

  public setRequested(user: User) {
    this.footer = { text: `Requested by ${user.tag}`, iconURL: user.displayAvatarURL() };
    return this;
  }
}

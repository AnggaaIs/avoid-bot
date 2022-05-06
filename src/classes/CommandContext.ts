import { CommandInteraction, InteractionReplyOptions, Message } from "discord.js";
import Client from "./Client";

export default class InteractionCommandContext {
  public constructor(protected client: Client, public interaction: CommandInteraction) {}

  public async sendMessage(
    msg: string | InteractionReplyOptions,
    opt: { ephemeral?: boolean; timeout?: number } = { ephemeral: false, timeout: undefined }
  ): Promise<Message | any> {
    if (opt && opt.ephemeral && opt.timeout !== undefined)
      return new Error("Timeout properties cannot be defined when Ephemerals are active, and vice versa.");

    const isTimeout: boolean = opt.timeout !== undefined ? true : false;

    if (typeof msg === "string") {
      await this.interaction.reply({ content: msg, ephemeral: opt.ephemeral });
      if (isTimeout) setTimeout(() => this.interaction.deleteReply().catch(() => {}), opt.timeout);
    }

    if (typeof msg === "object") {
      if ((msg as InteractionReplyOptions).ephemeral && isTimeout)
        return new Error("Timeout properties cannot be defined when Ephemerals are active, and vice versa.");
      await this.interaction.reply(msg);
      if (isTimeout) setTimeout(() => this.interaction.deleteReply().catch(() => {}), opt.timeout);
    }
  }
}

import CommandContext from "./CommandContext";
import { CommandOptions } from "../interfaces";
import { ApplicationCommandOptionData, PermissionString } from "discord.js";
import Client from "./Client";

export default abstract class Command {
  public readonly name: string;
  public readonly description?: string;
  public readonly category?: string;
  public readonly cooldown?: number;
  public readonly devOnly?: boolean;
  public readonly inDm?: boolean;
  public readonly permissions?: {
    client?: PermissionString[];
    user?: PermissionString[];
  };
  public readonly options?: ApplicationCommandOptionData[];

  public constructor(protected client: Client, opt: CommandOptions) {
    this.name = opt.name;
    this.description = opt.description ?? "No description provided.";
    this.category = opt.category ?? "Uncategorized";
    this.cooldown = opt.cooldown ?? 2;
    this.devOnly = opt.devOnly ?? false;
    this.inDm = opt.inDm ?? false;
    this.permissions = opt.permissions ?? { client: [], user: [] };
    this.options = opt.options ?? [];
  }

  public abstract run(ctx: CommandContext): void;
}

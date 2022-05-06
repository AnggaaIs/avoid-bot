import { ApplicationCommandOptionData, Message, PermissionString } from "discord.js";

export interface EventOptions {
  name: string;
  once?: boolean;
}

export interface CommandOptions {
  name: string;
  description?: string;
  category?: string;
  cooldown?: number;
  devOnly?: boolean;
  inDm?: boolean;
  permissions?: {
    client?: PermissionString[];
    user?: PermissionString[];
  };
  options?: ApplicationCommandOptionData[];
}

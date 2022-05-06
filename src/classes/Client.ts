import { DatabaseService } from "../database/Service";
import {
  ApplicationCommand,
  ApplicationCommandDataResolvable,
  ChatInputApplicationCommandData,
  Client,
  ClientOptions,
  Collection,
} from "discord.js";
import mongoose from "mongoose";
import { join } from "path";
import Command from "./Command";
import Logger from "./Logger";
import CommandManager from "./managers/Command";
import EventManager from "./managers/Event";
import { ApplicationCommandTypes } from "discord.js/typings/enums";
import botConfig from "../utils/config";

const folderEvent = join(__dirname, "../events");
const folderCommand = join(__dirname, "../commands");

export default class OrigamiClient extends Client {
  public constructor(options?: ClientOptions) {
    super(options);
  }
  public config: typeof botConfig = botConfig;
  public log: Logger = new Logger();
  private eventManager = new EventManager(this);
  private commandManager = new CommandManager(this);
  public database = new DatabaseService(this);
  public commands: Collection<string, Command> = new Collection();
  public cooldowns: Collection<string, Collection<string, number>> = new Collection();

  async init(): Promise<void> {
    try {
      await this.database.connect();
      this.loadManager();

      mongoose.connection.on("connected", () => {
        this.log.info("Database (MongoDb) connected.");
      });
      this.login(this.config.token);
    } catch (err) {
      this.log.error(`Failed to start a bot ${err}`);
    }
  }

  private loadManager(): void {
    this.eventManager
      .init(folderEvent)
      .then(() => {
        this.log.info(`Events succesfully load.`);
      })
      .catch((err) => {
        this.log.error(`Failed to load events ${err.stack}`);
      });

    this.commandManager
      .init(folderCommand)
      .then(() => {
        this.log.info(`Commands succesfully load.`);
      })
      .catch((err) => {
        this.log.error(`Failed to load commands ${err.stack}`);
      });
  }

  public async syncApplicationCommands(): Promise<void> {
    try {
      const isProduction = process.env.NODE_ENV === "production";

      let commandList: Array<ApplicationCommandDataResolvable> = [];

      let commandsRegister: any;
      if (isProduction) commandsRegister = await this.application.commands.fetch();
      else commandsRegister = await this.application.commands.fetch({ guildId: this.config.guild_id_dev });

      const { commands } = this;
      commands.forEach((cmd: Command) => {
        const option: ChatInputApplicationCommandData = {
          name: cmd.name.toLowerCase(),
          description: cmd.description as string,
          type: ApplicationCommandTypes["CHAT_INPUT"],
          options: cmd.options,
        };

        if (isProduction) {
          if (cmd.category === "Developer" && cmd.devOnly) return;
        }
        commandList.push(option);
      });

      if (isProduction) {
        for (const cmd of commandList) {
          await this.application.commands.create(cmd);
        }

        const deletedCommands = commandsRegister.filter((a: ApplicationCommand) => !commandList.some((b) => b.name === a.name));

        deletedCommands.forEach(async (dCmd: ApplicationCommand) => {
          await this.application.commands.delete(dCmd.id);
        });

        this.log.info("Application command is successfully synchronized globally.");
      } else {
        for (const cmd of commandList) {
          await this.application.commands.create(cmd, this.config.guild_id_dev);
        }

        const deletedGuildsCommands = commandsRegister.filter(
          (a: ApplicationCommand) => !commandList.some((b) => b.name === a.name)
        );

        deletedGuildsCommands.forEach(async (dCmd: ApplicationCommand) => {
          await this.application.commands.delete(dCmd.id, this.config.guild_id_dev);
        });

        const guild = this.guilds.cache.get(this.config.guild_id_dev);
        this.log.info(`Application command is successfully synchronized in the guild ${guild.name}.`);
      }
    } catch (err) {
      this.log.error(`Application command failed to sync ${err.stack}`);
    }
  }
}

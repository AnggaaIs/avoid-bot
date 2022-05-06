import Client from "@avoid/classes/Client";
import Event from "@avoid/classes/Event";
import { Interaction, TextChannel, Message, PermissionString } from "discord.js";
import CommandContext from "@avoid/classes/CommandContext";
import Command from "@avoid/classes/Command";
import Collection from "@discordjs/collection";
import { toTitleCase } from "@avoid/utils";

export default class InteractionCreateEvent extends Event {
  public constructor(protected client: Client) {
    super(client, {
      name: "interactionCreate",
    });
  }

  public async run(interaction: Interaction): Promise<Message | void> {
    if (!interaction.isCommand()) return;

    const ctx = new CommandContext(this.client, interaction);
    const user = ctx.interaction.user;

    let userData = await this.client.database.user.findOne({ id: user.id });
    if (!userData) userData = await this.client.database.user.create({ id: user.id });

    const commandName = ctx.interaction.commandName;
    const command: Command = this.client.commands.get(commandName.toLowerCase());
    if (!command) return;

    if (command.devOnly && !this.client.config.owners.includes(user.id)) return;

    if (!command.inDm && ctx.interaction.channel.type === "DM") {
      ctx.sendMessage(":x: | Sorry, this command can only be execute on the server.", { timeout: 15000 });
      return;
    }

    if (ctx.interaction.inGuild()) {
      let guildData = await this.client.database.guild.findOne({ id: ctx.interaction.guildId });
      if (!guildData) guildData = await this.client.database.guild.create({ id: ctx.interaction.guildId });

      //Afk remove handler
      if (userData && userData.afkData) {
        await userData.updateOne({ afkData: null });

        ctx.sendMessage(`:teddy_bear: | Welcome back <@${user.id}>, I removed your AFK.`, { timeout: 30000 });
        return;
      }

      //Disable command handler
      if (guildData && guildData.disableCommands?.includes(command.name)) {
        ctx.sendMessage(`:x: | Sorry, \`${command.name.toLowerCase()}\` command is disabled for this server!`, {
          ephemeral: true,
        });
        return;
      }

      const textChannel = ctx.interaction.channel as TextChannel;
      const clientPermissions = this.client.guilds.cache
        .get(ctx.interaction.guildId)
        .members.cache.get(this.client.user.id).permissions;
      const userPermissions = this.client.guilds.cache.get(ctx.interaction.guildId).members.cache.get(user.id).permissions;

      if (!textChannel.permissionsFor(this.client.user.id).has("SEND_MESSAGES") || !clientPermissions.has("SEND_MESSAGES")) {
        ctx.interaction.user
          .send({ content: `:x: | <@${user.id}>, I don't have permission to send messages on <#${textChannel.id}>.` })
          .then((msg) => {
            setTimeout(() => {
              msg.delete();
            }, 120000); // 2  Minutes
          })
          .catch(() => {});
        return;
      }

      if (!textChannel.permissionsFor(this.client.user.id).has("EMBED_LINKS") || !clientPermissions.has("EMBED_LINKS")) {
        ctx.sendMessage(":x: | I need `embed links` permission to work properly!", { timeout: 30000 });
        return;
      }

      let {
        permissions: { user: uPerm, client: cPerm },
      } = command;
      const cPermArray: PermissionString[] = [];
      const uPermArray: PermissionString[] = [];
      if (!cPerm) cPerm = [];
      if (!uPerm) uPerm = [];

      // Client permissions handler
      if (cPerm.length > 0) {
        cPerm.forEach((perm: PermissionString) => {
          if (!clientPermissions.has(perm)) cPermArray.push(perm);
        });
      }

      //User permissions handler
      if (uPerm.length > 0) {
        uPerm.forEach((perm: PermissionString) => {
          if (!userPermissions.has(perm)) uPermArray.push(perm);
        });
      }

      if (cPermArray.length > 0) {
        const perm = cPermArray.map((perm: PermissionString) => `${toTitleCase(perm.replace(/_/g, " "))}`).join(", ");
        ctx.sendMessage(`I don't have \`${perm}\` permission to run this command!`, { timeout: 15000 });
        return;
      }

      if (uPermArray.length > 0) {
        const perm = uPermArray.map((perm: PermissionString) => `${toTitleCase(perm.replace(/_/g, " "))}`);
        ctx.sendMessage(`You don't have \`${perm}\` permission to run this command!s`, { ephemeral: true });
        return;
      }
    }

    if (command.cooldown || command.cooldown > 0) {
      if (!this.client.cooldowns.has(command.name)) this.client.cooldowns.set(command.name, new Collection());

      const timeStamp: Collection<string, number> = this.client.cooldowns.get(command.name);
      const amount: number = command.cooldown * 1000;

      if (!timeStamp.has(user.id)) {
        timeStamp.set(user.id, Date.now());

        // Delete cooldown for owner :v
        if (this.client.config.owners.includes(user.id)) timeStamp.delete(user.id);
      } else {
        const time = timeStamp.get(user.id) + amount;
        if (Date.now() < time) {
          const timeLeft = (time - Date.now()) / 1000;

          ctx.sendMessage(`Oopppss, wait \`${timeLeft.toFixed(1)}\` seconds to try it again.`, { ephemeral: true });
          return;
        }

        timeStamp.set(user.id, Date.now());
        setTimeout(() => timeStamp.delete(user.id), amount);
      }
    }

    //Counting command for user
    if (!userData.cmdRunner?.firstTime) {
      await userData.updateOne({ cmdRunner: { firstTime: new Date(), amountRun: 1 } });
    } else {
      await userData.updateOne({ $inc: { "cmdRunner.amountRun": 1 } });
    }

    //Counting command for guild
    if (ctx.interaction.inGuild()) {
      let guildData = await this.client.database.guild.findOne({ id: ctx.interaction.guildId });
      if (!guildData) guildData = await this.client.database.guild.create({ id: ctx.interaction.guildId });

      if (!guildData.cmdRunner?.firstTime) {
        await guildData.updateOne({ cmdRunner: { firstTime: new Date(), amountRun: 1 } });
      } else {
        await guildData.updateOne({ $inc: { "cmdRunner.amountRun": 1 } });
      }
    }

    new Promise((resolve) => {
      resolve(command.run(ctx));
    }).catch((err) => {
      this.client.log.error(err.stack);
    });
  }
}

import { Message } from "discord.js";
import Client from "@avoid/classes/Client";
import Event from "@avoid/classes/Event";

export default class MessageCreateEvent extends Event {
  public constructor(protected client: Client) {
    super(client, {
      name: "messageCreate",
    });
  }

  public async run(message: Message): Promise<void> {
    if (message.author.bot) return;
    const userPattern = new RegExp(/<@(?<id>\d{17,20})>/);
    const content = message.content;
    const userExec = userPattern.exec(content);
    const user = message.author;
    const inGuild = message.inGuild();
    const userData = await this.client.database.user.findOne({ id: user.id });

    //Afk handler
    if (inGuild) {
      if (userData && userData.afkData) {
        await userData.updateOne({ afkData: null });

        message
          .reply(`:teddy_bear: | Welcome back **${user.tag}**, I removed your AFK.`)
          .then((m) => {
            setTimeout(() => {
              if (m.deletable) m.delete().catch(() => {});
            }, 30000);
          })
          .catch(() => {});
        return;
      }

      if (userExec && user.id !== userExec.groups.id) {
        const groups = userExec.groups;
        const userMention = this.client.users.cache.get(groups.id);
        if (!userMention) return;

        const userDataA = await this.client.database.user.findOne({ id: groups.id });
        if (!userDataA?.afkData) return;
        else {
          const date = Math.floor(new Date(userDataA.afkData.date).getTime() / 1000);
          const reason = userDataA.afkData.reason;

          message
            .reply(`:zzz: | **${userMention.tag}** is currently AFK, reason: \`${reason}\` | <t:${date}:R>`)
            .then((m) => {
              setTimeout(() => {
                if (m.deletable) m.delete().catch(() => {});
              }, 30000);
            })
            .catch(() => {});
        }
      }
    }
  }
}

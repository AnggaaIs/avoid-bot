import Client from "@avoid/classes/Client";
import Event from "@avoid/classes/Event";

export default class ReadyEvent extends Event {
  public constructor(protected client: Client) {
    super(client, {
      once: true,
      name: "ready",
    });
  }

  public async run(): Promise<void> {
    await this.client.syncApplicationCommands();
    this.client.user.setActivity({
      name: "Avoid",
      type: 2,
    });

    this.client.log.info(`${this.client.user.tag} Connected to Discord.`);
  }
}

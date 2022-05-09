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
      name: `${this.client.user.username} | release v${this.client.config.version}`,
      type: 5,
    });

    this.client.log.info(`${this.client.user.tag} Connected to Discord.`);
  }
}

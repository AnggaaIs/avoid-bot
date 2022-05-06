import Client from "../../classes/Client";
import { readdirSync } from "fs";
import Event from "../Event";

export default class EventManager {
  public constructor(protected client: Client) {}

  public async init(path: string): Promise<void> {
    const directory = readdirSync(path, { withFileTypes: true });

    directory.forEach(async (a) => {
      if (a.isDirectory()) {
        return this.init(`${path}/${a.name}`);
      }

      const ImportedEvent = (await import(`${path}/${a.name}`)).default;
      const event: Event = new ImportedEvent(this.client);

      if (event.once) {
        this.client.once(event.name, (...params) => event.run(...params));
      } else {
        this.client.on(event.name, (...params) => event.run(...params));
      }
    });
  }
}

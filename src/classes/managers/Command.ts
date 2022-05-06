import Client from "../../classes/Client";
import Command from "../../classes/Command";
import { readdirSync } from "fs";

export default class CommandManager {
  public constructor(protected client: Client) {}

  public async init(path: string): Promise<void> {
    const directory = readdirSync(path, { withFileTypes: true });

    directory.forEach(async (a) => {
      if (a.isDirectory()) {
        return this.init(`${path}/${a.name}`);
      }

      const ImportedCommand = (await import(`${path}/${a.name}`)).default;
      const command: Command = new ImportedCommand(this.client);

      this.client.commands.set(command.name.toLowerCase(), command);
    });
  }
}

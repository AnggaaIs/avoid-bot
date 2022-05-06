import { EventOptions } from "../interfaces";
import Client from "./Client";

export default abstract class Event {
  public readonly name: string;
  public readonly once: boolean;

  public constructor(protected client: Client, opt: EventOptions) {
    this.name = opt.name;
    this.once = opt.once ?? false;
  }

  public abstract run(...params: unknown[]): void;
}

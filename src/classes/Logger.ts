import chalk from "chalk";
import moment from "moment";

export default class Logger {
  public constructor() {}

  private dateNow(): string {
    return moment(Date.now()).format("h:mm:ss A");
  }

  public convertChalk(value: string, color: string): string {
    return chalk.hex(color)(value);
  }

  private toConsole(value: string, type: string, color: string): any {
    return console.log(`${this.dateNow()} | [ ${this.convertChalk(type, color)} ] - ${value}`);
  }

  public info(value: string): void {
    this.toConsole(value, "INFO", "#26ff52");
  }

  public warn(value: string): void {
    this.toConsole(value, "WARN", "#fbff26");
  }

  public error(value: string): void {
    this.toConsole(value, "ERROR", "#ff0000");
  }
}

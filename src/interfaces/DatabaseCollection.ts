export interface GuildModels {
  id: string;
  prefix?: string[];
  cmdRunner?: {
    firstTime?: Date;
    amountRun: number;
  };
  disableCommands: string[];
  logs?: {
    channel?: string;
    list?: LogsList[];
  };
}

interface LogsList {
  name: string;
  status: boolean;
}

export interface UserModels {
  id: string;
  cmdRunner?: {
    firstTime?: Date;
    amountRun?: number;
  };
  afkData?: {
    date?: Date;
    reason?: string;
  };
}

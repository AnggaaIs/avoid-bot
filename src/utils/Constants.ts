import { ColorResolvable } from "discord.js";

export const Colors = {
  general: "#ffffff" as ColorResolvable,
  error: "#ff0000" as ColorResolvable,
};

export const UserFlagEmojis = {
  "Bug Hunter Level 1": "<:BUG_HUNTER_LEVEL_1:965253401942306876>",
  "Bug Hunter Level 2": "<:BUG_HUNTER_LEVEL_2:965253469453811753>",
  "Discord Certified Moderator": "<:DiscordCertifiedModerator:965253619362431016>",
  "Discord Employee": "<:discordEmployee:965253763885572129>",
  "Early Supporter": "<:early_supporter:965253878020976711>",
  "Early Verified Bot Developer": "<:EarlyVerifiedBotDeveloper:965253981838381056>",
  "House Balance": "<:House_Balance:965254047420518431>",
  "House Bravery": "<:House_Bravery:965254149140791317>",
  "House Brilliance": "<:house_brilliance:965254391043072021>",
  "Hypesquad Events": "<:hypesquad_events:965254718391722024>",
  "Partnered Server Owner": "<:PartneredServerOwner:965254813845708870>",
  "Team User": "",
  "Verified Bot": "",
};

export const PremiumGuildLevel = {
  NONE: "0",
  TIER_1: "1",
  TIER_2: "2",
  TIER_3: "3",
};

export const DefaultLogsList = [
  {
    name: "Message Delete",
    status: false,
  },
  {
    name: "Message Update",
    status: false,
  },
  {
    name: "Message Delete Bulk",
    status: false,
  },
  {
    name: "Guild Ban Add",
    status: false,
  },
  {
    name: "Guild Ban Remove",
    status: false,
  },
];

Object.freeze(Colors);
Object.freeze(UserFlagEmojis);
Object.freeze(PremiumGuildLevel);

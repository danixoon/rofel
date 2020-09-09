import * as Discord from "discord.js";
import * as dotenv from "dotenv";

dotenv.config();

import { combineCommandors } from "./commands";
import musicCommand from "./commands/music";
import redditCommand from "./commands/reddit";
import sayCommand from "./commands/say";
import talkCommand from "./commands/talk";
import rogueCommand from "./commands/rogue";

const commandor = combineCommandors(
  musicCommand,
  redditCommand,
  sayCommand,
  talkCommand,
  rogueCommand
);

const client = new Discord.Client();

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("message", async (msg) => {
  if (!msg.author.bot) commandor.parse(msg.content, msg);
});

client.login(process.env.CLIENT_TOKEN);

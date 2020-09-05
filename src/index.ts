import * as Discord from "discord.js";
import * as dotenv from "dotenv";

dotenv.config();

import { getCommandor } from "./commands";

const client = new Discord.Client();
const commandor = getCommandor();

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("message", async (msg) => {
  if (!msg.author.bot) commandor.parse(msg.content, msg);
});

client.login(process.env.CLIENT_TOKEN);

import * as Discord from "discord.js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as ytdl from "ytdl-core";

import axios from "axios";
import { RandomReddit } from "random-reddit";
import { Readable } from "stream";

dotenv.config();

let client = new Discord.Client();

const reddit = new RandomReddit({
  username: process.env.REDDIT_USERNAME,
  password: process.env.REDDIT_PASSWORD,
  app_id: process.env.REDDIT_APP_ID,
  api_secret: process.env.REDDIT_API_SECRET,
  logs: true, // specify this if you want logs from this package
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

const connections = new Map<
  string,
  {
    voice: Discord.VoiceConnection;
    stream: Readable;
    broadcast: Discord.StreamDispatcher;
  }
>();
const dialogs = new Map<string, [string, string][]>();

client.on("message", async (msg) => {
  const commands = msg.content.trim().split(/\s+/gm);

  switch (commands[0]) {
    case "дай": {
      const image = await reddit.getImage("hmmm");
      msg.reply("на", { files: [image] });
      break;
    }

    case "хочу": {
      const channel = msg.member.voice.channel;
      if (channel) {
        const url = commands[1];
        if (url) {
          const activeBroadcast = connections.get(channel.id);

          if (!activeBroadcast) {
            const connection = await channel.join();
            const stream = ytdl(url);
            const broadcast = connection.play(stream);

            connections.set(channel.id, {
              stream,
              broadcast,
              voice: connection,
            });
            connection.on("disconnect", () => {
              const broadcast = connections.get(channel.id);
              if (broadcast) {
                broadcast.stream.destroy();
                broadcast.broadcast.destroy();
              }
              connections.delete(channel.id);
            });
          } else {
            activeBroadcast.stream.destroy();
            activeBroadcast.stream = ytdl(url);

            activeBroadcast.broadcast = activeBroadcast.voice.play(
              activeBroadcast.stream
            );
          }
        }
      }
      break;
    }
    default: {
      if (msg.channel.id !== process.env.DISCORD_TALK_ID || msg.author.bot)
        break;

      const dialog = dialogs.get(msg.author.id) || [];
      const dialogRequest = dialog
        .map(([req, ans], i) => `request_${i}=${req}&answer_${i}=${ans}`)
        .join("&");

      const body = `request=${msg.content}&bot_name=кит&user_name=${
        msg.member.displayName
      }${dialogRequest ? `&${dialogRequest}` : ""}&${process.env.TALK_URL}`;

      const answer = await axios.post("http://p-bot.ru/api/getAnswer", body, {
        headers: {
          // accept: "*/*",
          // "accept-language": "ru",
          // "content-type": "application/x-www-form-urlencoded",

          // referrer: "http://p-bot.ru/",
          // referrerPolicy: "no-referrer-when-downgrade",

          method: "POST",
          // mode: "cors",
          // credentials: "include",
        },
      });

      msg.reply(answer.data.answer);

      dialog.push([msg.content, answer.data.answer]);
      let slicedDialog = dialog.slice(-4);
      dialogs.set(msg.author.id, slicedDialog);
      break;
    }
  }
});

client.login(process.env.CLIENT_TOKEN);

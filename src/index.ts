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
        const url = commands[1].startsWith("http")
          ? commands[1]
          : commands[1] === "вайб"
          ? "https://www.youtube.com/watch?v=5qap5aO4i9A"
          : null;

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
          msg.reply("держи");
        } else msg.reply("че хочешь?");
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

      const getRandomArray = () => {
        let a: number;
        let arr = [];
        for (let i = 0; i < 256; i++) {
          a = i;
          for (let j = 0; j < 8; j++) {
            a = a & 0x1 ? 0xedb88320 ^ (a >>> 0x1) : a >>> 0x1;
          }
          arr[i] = a;
        }
        return arr;
      };

      const crc = (value: string) => {
        let arr = getRandomArray();
        let a = 0x0 ^ -0x1;
        for (let i = 0; i < value.length; i++) {
          a = (a >>> 0x8) ^ arr[(a ^ value.charCodeAt(i)) & 0xff];
        }
        return (a ^ -0x1) >>> 0x0;
      };

      const getCRCSign = (time) => {
        return crc(
          "public-api" +
            time +
            process.env.TALK_KEY1 +
            process.env.TALK_KEY2 +
            process.env.TALK_KEY3
        );
      };

      const getSecretKey = (time: string) => {
        return `a=public-api&b=${crc(time + "b")}&c=${getCRCSign(time)}&d=${crc(
          Date.now() + "d"
        )}&e=${Math.random()}&t=${time}&x=${Math.random() * 10}`;
      };

      const secret = getSecretKey(new Date().getTime().toString());

      const body = `request=${msg.content}&bot_name=кит&user_name=${
        msg.member.displayName
      }${dialogRequest ? `&${dialogRequest}` : ""}&dialog_lang=ru&${secret}`;

      const answer = await axios.post("http://p-bot.ru/api/getAnswer", body);

      msg.reply(answer.data.answer);

      dialog.push([msg.content, answer.data.answer]);
      let slicedDialog = dialog.slice(-4);
      dialogs.set(msg.author.id, slicedDialog);
      break;
    }
  }
});

client.login(process.env.CLIENT_TOKEN);

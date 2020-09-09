import * as ytdl from "ytdl-core";
import { Commandor } from "./";

const commandor = new Commandor();
commandor
  .command("хочу [url]")
  .check(({ command: { url }, context }) => {
    if (!url?.startsWith("http") && url !== "вайб") {
      context.reply("че это за ссылка");
      return true;
    }
    if (!context.member.voice.channel) {
      context.reply("в канал войди а");
      return true;
    }
  })
  .handler(async ({ command: { url }, context }) => {
    try {
      const stream = ytdl(
        url === "вайб" ? "https://www.youtube.com/watch?v=5qap5aO4i9A" : url
      );
      const connection = await context.member.voice.channel.join();
      connection.play(stream);
      context.reply("держи");
    } catch (err) {
      context.reply("а ссылочка то палёная");
      console.log(err);
    }
  });

export default commandor;

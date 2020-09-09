import { Readable } from "stream";
import * as api from "../api";
import { Commandor } from "./";

const commandor = new Commandor();
commandor
  .command("скажи")
  .check(({ context }) => {
    if (!context.member.voice.channel) {
      context.reply("в канал войди а");
      return true;
    }
  })
  .handler(async ({ context }) => {
    const connection = await context.member.voice.channel.join();
    const [response] = await api.speech.synthesizeSpeech({
      input: { text: context.content.split(/\s+/gm).slice(1).join(" ") },
      voice: { languageCode: "ru-RU", ssmlGender: "NEUTRAL" },
      audioConfig: { audioEncoding: "OGG_OPUS" },
    });

    const audioStream = new Readable({
      read() {
        this.push(response.audioContent);
        this.push(null);
      },
    });

    connection.play(audioStream, { type: "ogg/opus" });
  });

export default commandor;

import * as Discord from "discord.js";
import * as api from "../api";
import { Commandor } from "./";
import { Readable } from "stream";

const commandor = new Commandor();
const speechChannels = new Set<string>();

commandor
  .command("*")
  .check(({ context }) => {
    return context.channel.id !== process.env.DISCORD_TALK_ID;
  })
  .handler(async ({ context }) => {
    const answer = await api.getAnswer(
      context.content,
      context.member.displayName,
      context.member.id
    );
    context.reply(answer);
    const voiceChannelID = context.member.voice.channelID;
    const voiceConnection = context.client.voice.connections.get(
      context.guild.id
    );

    if (
      voiceChannelID &&
      voiceConnection &&
      voiceConnection.channel.id === voiceChannelID &&
      speechChannels.has(voiceChannelID)
    ) {
      const [response] = await api.speech.synthesizeSpeech({
        input: { text: answer },
        voice: { languageCode: "ru-RU", ssmlGender: "NEUTRAL" },
        audioConfig: { audioEncoding: "OGG_OPUS" },
      });

      const audioStream = new Readable({
        read() {
          this.push(response.audioContent);
          this.push(null);
        },
      });

      voiceConnection.play(audioStream, { type: "ogg/opus" });
    }
  });

commandor
  .command("вслух")
  .check(({ context }) => {
    if (!context.member.voice.channel) return context.reply("че вслух");
    if (speechChannels.has(context.member.voice.channelID))
      return context.reply("уже говорю");
  })
  .handler(async ({ context }) => {
    const connection = await context.member.voice.channel.join();
    speechChannels.add(connection.channel.id);
    context.reply("ладно.");
  });

commandor
  .command("заткнись")
  .check(({ context }) => {
    const voiceConnection = context.client.voice.connections.get(
      context.guild.id
    );
    if (
      !context.member.voice.channel ||
      !voiceConnection ||
      voiceConnection.channel.id !== context.member.voice.channelID
    )
      return context.reply("нет");
  })
  .handler(async ({ context }) => {
    context.member.voice.channel.leave();
    speechChannels.delete(context.member.voice.channel.id);
  });

export default commandor;

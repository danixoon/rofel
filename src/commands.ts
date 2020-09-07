import * as Discord from "discord.js";
import * as yargs from "yargs";
import * as ytdl from "ytdl-core";
import * as api from "./api";
import { Readable } from "stream";

type CommandValidator<T, C> = (command: { context: C; command: T }) => boolean;
type CommandHandler<T, C> = (command: { context: C; command: T }) => any;

class Command<T = string[], C = Discord.Message> {
  public _template: string;
  public constructor(template: string) {
    this._template = template;
  }
  public _validator: CommandValidator<T, C> = () => false;
  public check(validator: CommandValidator<T, C>): this {
    this._validator = validator;
    return this;
  }
  public _handler: CommandHandler<T, C> = () => {};
  public handler(handler: CommandHandler<T, C>): this {
    this._handler = handler;
    return this;
  }
}

interface ICommand<T, C> {
  handler(handler: CommandHandler<T, C>): this;
  check(validator: CommandValidator<T, C>): this;
}

export class Commandor {
  private commands: Command<any>[] = [];
  public command<T = any>(
    template: "*" | string
  ): ICommand<T, Discord.Message> {
    const newCommand = new Command<T>(template);
    this.commands.push(newCommand);
    return newCommand;
  }
  public parse(commandText: string, context: Discord.Message) {
    const commandArgs = commandText.trim().split(/\s+/gm);

    const targetCommands = [
      this.commands.find(
        (cmd) => cmd._template.match(/\S+/gm)[0] === commandArgs[0]
      ),
    ].filter((a) => a);

    if (targetCommands.length === 0)
      targetCommands.push(
        ...this.commands.filter((cmd) => cmd._template === "*")
      );

    targetCommands.forEach((targetCommand) => {
      const matches = Array.from(
        targetCommand._template.matchAll(/\[(.+?)\]/gm)
      );
      const args = commandArgs
        .slice(1, matches.length + 1)
        .reduce((args, cmd, i) => ({ ...args, [matches[i][1]]: cmd }), {});
      if (targetCommand._validator({ command: args, context })) return;
      targetCommand._handler({ command: args, context });
    });
  }
}

export const getCommandor = () => {
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
  commandor
    .command("*")
    .check(({ context }) => {
      return context.channel.id !== process.env.DISCORD_TALK_ID;
    })
    .handler(async ({ context }) => {
      context.reply(
        await api.getAnswer(
          context.content,
          context.member.displayName,
          context.member.id
        )
      );
    });
  commandor.command("дай").handler(async ({ context }) => {
    const image = await api.reddit.getImage("hmmm");
    context.reply("на", { files: [image] });
  });

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

  return commandor;
};

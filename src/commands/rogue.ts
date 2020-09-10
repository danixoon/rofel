import * as Discord from "discord.js";
import * as api from "../api";
import { Commandor } from "./";
import { dir } from "console";
import { EventEmitter } from "events";

class Game {
  private client: Discord.Client;
  private message: Discord.Message;
  private channel: Discord.TextChannel;
  private id: number;
  private size: number;
  private field: string[] = [];

  private handleReaction = async (
    reaction: Discord.MessageReaction,
    user: Discord.User
  ) => {
    if (this.message.id !== reaction.message.id) return;
    if (user.bot) return;

    reaction.users.remove(user);
    switch (reaction.emoji.name) {
      case "➡️":
        this.move("right");
        break;
      case "⬅️":
        this.move("left");
        break;
      case "⬆️":
        this.move("up");
        break;
      case "⬇️":
        this.move("down");
        break;
    }

    this.message = await reaction.message.edit(this.getField().join("\n"));
  };

  public async start(
    client: Discord.Client,
    channel: Discord.TextChannel,
    size: number
  ) {
    this.client = client;
    this.channel = channel;
    this.size = size;

    const field = new Array(size * size).fill(":full_moon:");
    const id = Math.floor(Math.random() * field.length);
    field[id] = ":new_moon_with_face:";

    this.id = id;
    this.field = field;
    this.client.on("messageReactionAdd", this.handleReaction);

    this.message = await this.channel.send({
      content: this.getField().join("\n"),
    });

    await Promise.all(
      ["⬅️", "⬇️", "⬆️", "➡️"].map((v) => this.message.react(v))
    );
  }

  public stop() {
    this.client.off("messageReactionAdd", this.handleReaction);
  }

  public setMessage(message: Discord.Message) {
    this.message = message;
  }
  public move(direction: "up" | "left" | "down" | "right") {
    let x = this.id % this.size;
    let y = Math.floor(this.id / this.size);

    switch (direction) {
      case "down":
        y++;
        break;
      case "left":
        x--;
        break;
      case "right":
        x++;
        break;
      case "up":
        y--;
        break;
    }

    x = x >= this.size ? 0 : x < 0 ? this.size - 1 : x;
    y = y >= this.size ? 0 : y < 0 ? this.size - 1 : y;

    this.field[this.id] = ":full_moon:";
    this.id = x + y * this.size;
    this.field[this.id] = ":new_moon_with_face:";
  }

  private getField(): string[] {
    const createField = (arr: string[], size: number): string[] => {
      if (arr.length < size) return [arr.join("")];
      return [
        arr.slice(0, size).join(""),
        ...createField(arr.slice(size), size),
      ];
    };
    return createField(this.field, this.size);
  }
}

const commandor = new Commandor();
const games = new Map<string, Game>();

commandor
  .command("рогалик [action]")
  .check(({ command, context }) => {
    if (!["старт", "стоп"].includes(command.action?.toLowerCase()))
      return context.reply("рогалик [старт | стоп], чел..");

    const action = command.action.toLowerCase() === "старт" ? "start" : "stop";
    const game = games.get(context.channel.id);

    if (!game && action === "stop") return context.reply("ты не в игре, чел..");
    else if (game && action === "start")
      return context.reply("ты уже в игре, чел..");

    command.game = game;
    command.action = action;
  })
  .handler(async ({ context, command }) => {
    const channel = context.channel as Discord.TextChannel;
    let game = games.get(channel.id);

    switch (command.action) {
      case "stop":
        game.stop();
        games.delete(channel.id);

        context.reply("игры больше нет.");
        break;
      case "start":
        game = new Game();
        game.start(context.client, channel, 5);
        games.set(channel.id, game);

        context.reply("игра началась.");
        break;
    }
  });

export default commandor;

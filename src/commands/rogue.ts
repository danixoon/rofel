import * as Discord from "discord.js";
import * as api from "../api";
import { Commandor } from "./";
import { dir } from "console";

class Game {
  private message: Discord.Message;
  private id: number;
  private size: number;

  public field: string[] = [];

  constructor(size: number) {
    const fieldArray = new Array(size * size).fill(":full_moon:");
    this.id = Math.floor(Math.random() * fieldArray.length);
    fieldArray[this.id] = ":new_moon_with_face:";

    this.field = fieldArray;
    this.size = size;
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
  public getField(): string[] {
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
    const gameChannelID = context.channel.id;
    const handleReaction = async (
      reaction: Discord.MessageReaction,
      user: Discord.User
    ) => {
      if (gameChannelID !== reaction.message.channel.id) return;
      if (user.bot) return;

      const game = games.get(gameChannelID);
      reaction.users.remove(user);
      switch (reaction.emoji.name) {
        case "➡️":
          game.move("right");
          break;
        case "⬅️":
          game.move("left");
          break;
        case "⬆️":
          game.move("up");
          break;
        case "⬇️":
          game.move("down");
          break;
      }

      const message = await reaction.message.edit(game.getField().join("\n"));
      game.setMessage(message);
    };

    switch (command.action) {
      case "stop":
        games.delete(gameChannelID);
        context.client.off("messageReactionAdd", handleReaction);
        context.reply("игры больше нет.");
        break;
      case "start":
        const game = new Game(5);

        context.reply("игра началась.");
        const message = await context.channel.send({
          content: game.getField().join("\n"),
        });
        await Promise.all(
          ["⬇️", "⬆️", "⬅️", "➡️"].map((v) => message.react(v))
        );

        game.setMessage(message);
        games.set(gameChannelID, game);

        context.client.on("messageReactionAdd", handleReaction);
        break;
    }
  });

export default commandor;

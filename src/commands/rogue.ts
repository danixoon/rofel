import * as Discord from "discord.js";
import * as api from "../api";
import { Commandor } from "./";
import { dir } from "console";
import { EventEmitter } from "events";

interface IItem {
  sprite: string;
  activate(game: Game): void;
}

abstract class Item implements IItem {
  sprite = "⬛";
  protected id: number;
  constructor(id: number) {
    this.id = id;
  }
  activate(game: Game) {
    game.character.id = this.id;
  }
}

class FloorItem extends Item {}

class WallItem extends Item {
  readonly sprite = "⬜";
  activate(game: Game) {}
}

class Field {
  private field: IItem[] = [];
  private _size: number;
  private game: Game;
  public get size() {
    return this._size;
  }
  constructor(size: number, game: Game) {
    this._size = size;
    this.field = new Array<IItem>(size * size)
      .fill(null)
      .map((v, i) =>
        Math.random() > 0.1 ? new FloorItem(i) : new WallItem(i)
      );
    this.game = game;
  }
  public getField(): string[] {
    const createField = (arr: string[], size: number): string[] => {
      if (arr.length < size) return [arr.join("")];
      return [
        arr.slice(0, size).join(""),
        ...createField(arr.slice(size), size),
      ];
    };
    const field = this.field.map((f) => f.sprite);
    field[this.game.character.id] = this.game.character.sprite;

    return createField(field, this.size);
  }
  public activate(game: Game, id: number) {
    this.field[id].activate(game);
  }
}

class Character {
  public id: number;
  public sprite: string;
  public game: Game;
  constructor(id: number, game: Game, sprite: string) {
    this.id = id;
    this.game = game;
    this.sprite = sprite;
  }
}

class Game {
  private client: Discord.Client;
  private message: Discord.Message;
  private channel: Discord.TextChannel;

  private _field: Field;
  public get field() {
    return this._field;
  }
  private _character: Character;
  public get character() {
    return this._character;
  }

  private getMessage() {
    const message = new Discord.MessageEmbed();
    message
      .setColor("#ffffff")
      .setTitle("Рогалик сука")
      // .setURL("https://discord.js.org/")
      // .setAuthor(
      // "Зверь"
      // "https://i.imgur.com/wSTFkRM.png",
      // "https://discord.js.org"
      // )
      .setDescription(this.field.getField().join("\n"));
    // .setThumbnail("https://i.imgur.com/wSTFkRM.png")
    // .addFields(
    //   { name: "Regular field title", value: "Some value here" },
    //   { name: "\u200B", value: "\u200B" },
    //   { name: "Inline field title", value: "Some value here", inline: true },
    //   { name: "Inline field title", value: "Some value here", inline: true }
    // )
    // .addField("Inline field title", "Some value here", true)
    // .setImage("https://i.imgur.com/wSTFkRM.png")
    // .setTimestamp()
    // .setFooter("Ты скоро умрёшь.");

    return message;
  }

  private handleReaction = async (
    reaction: Discord.MessageReaction,
    user: Discord.User
  ) => {
    if (this.message.id !== reaction.message.id) return;
    if (user.bot) return;

    reaction.users.remove(user);
    switch (reaction.emoji.name) {
      case "➡️":
        this.use(1, 0);
        break;
      case "⬅️":
        this.use(-1, 0);
        break;
      case "⬆️":
        this.use(0, -1);
        break;
      case "⬇️":
        this.use(0, 1);
        break;
    }

    this.message = await reaction.message.edit(this.getMessage());
  };

  public async start(
    client: Discord.Client,
    channel: Discord.TextChannel,
    size: number
  ) {
    this.client = client;
    this.channel = channel;
    this._field = new Field(size, this);
    this._character = new Character(
      Math.floor(Math.random() * size ** 2),
      this,
      "🟨"
    );

    this.client.on("messageReactionAdd", this.handleReaction);

    this.message = await this.channel.send(this.getMessage());

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
  public use(dx: number, dy: number) {
    const { size } = this.field;

    let x = this.character.id % size;
    let y = Math.floor(this.character.id / size);

    x += dx;
    y += dy;

    x = x >= size ? 0 : x < 0 ? size - 1 : x;
    y = y >= size ? 0 : y < 0 ? size - 1 : y;

    const id = x + y * size;

    this.field.activate(this, id);
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
        game.start(context.client, channel, 14);
        games.set(channel.id, game);

        context.reply("игра началась.");
        break;
    }
  });

export default commandor;

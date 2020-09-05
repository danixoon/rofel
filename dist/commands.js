"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommandor = exports.Commandor = void 0;
const ytdl = require("ytdl-core");
const api = require("./api");
class Command {
    constructor(template) {
        this._validator = () => false;
        this._handler = () => { };
        this._template = template;
    }
    check(validator) {
        this._validator = validator;
        return this;
    }
    handler(handler) {
        this._handler = handler;
        return this;
    }
}
class Commandor {
    constructor() {
        this.commands = [];
    }
    command(template) {
        const newCommand = new Command(template);
        this.commands.push(newCommand);
        return newCommand;
    }
    parse(commandText, context) {
        const commandArgs = commandText.trim().split(/\s+/gm);
        const targetCommands = [
            this.commands.find((cmd) => cmd._template.match(/\S+/gm)[0] === commandArgs[0]),
        ].filter((a) => a);
        if (targetCommands.length === 0)
            targetCommands.push(...this.commands.filter((cmd) => cmd._template === "*"));
        targetCommands.forEach((targetCommand) => {
            const matches = Array.from(targetCommand._template.matchAll(/\[(.+?)\]/gm));
            const args = commandArgs
                .slice(1, matches.length + 1)
                .reduce((args, cmd, i) => (Object.assign(Object.assign({}, args), { [matches[i][1]]: cmd })), {});
            if (targetCommand._validator({ command: args, context }))
                return;
            targetCommand._handler({ command: args, context });
        });
    }
}
exports.Commandor = Commandor;
exports.getCommandor = () => {
    const commandor = new Commandor();
    commandor
        .command("хочу [url]")
        .check(({ command: { url }, context }) => {
        if (!(url === null || url === void 0 ? void 0 : url.startsWith("http")) && url !== "вайб") {
            context.reply("че это за ссылка");
            return true;
        }
        if (!context.member.voice.channel) {
            context.reply("в канал войди а");
            return true;
        }
    })
        .handler(({ command: { url }, context }) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const stream = ytdl(url === "вайб" ? "https://www.youtube.com/watch?v=5qap5aO4i9A" : url);
            const connection = yield context.member.voice.channel.join();
            connection.play(stream);
            context.reply("держи");
        }
        catch (err) {
            context.reply("а ссылочка то палёная");
            console.log(err);
        }
    }));
    commandor
        .command("*")
        .check(({ context }) => {
        return context.channel.id !== process.env.DISCORD_TALK_ID;
    })
        .handler(({ context }) => __awaiter(void 0, void 0, void 0, function* () {
        context.reply(yield api.getAnswer(context.content, context.member.displayName, context.member.id));
    }));
    commandor.command("дай").handler(({ context }) => __awaiter(void 0, void 0, void 0, function* () {
        const image = yield api.reddit.getImage("hmmm");
        context.reply("на", { files: [image] });
    }));
    return commandor;
};

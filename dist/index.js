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
const Discord = require("discord.js");
const dotenv = require("dotenv");
dotenv.config();
const commands_1 = require("./commands");
const client = new Discord.Client();
const commandor = commands_1.getCommandor();
client.once("ready", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Logged in as ${client.user.tag}`);
}));
client.on("message", (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (!msg.author.bot)
        commandor.parse(msg.content, msg);
}));
client.login(process.env.CLIENT_TOKEN);

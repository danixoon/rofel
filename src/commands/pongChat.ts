import * as api from "../api";
import { Commandor } from ".";
import * as Discord from "discord.js";

const activeChats = new Map<string, PongChat>();

class PongChat {
  channel: Discord.TextChannel;
  listeners: { [key: string]: (...args: any[]) => void };
  botIds: string[] = [];
  constructor(channel: Discord.TextChannel) {
    this.channel = channel;
    this.listeners = {
      dialogMessage: this.handleOnMessage,
      dialogOpened: this.handleOnDialog,
      dialogClosed: this.handleOnClose,
    };
    for (const event in this.listeners) {
      api.pongChatClient.on(event, this.listeners[event]);
    }
  }

  private handleOnMessage = (msg: any) => {
    const name = msg.botId === this.botIds[0] ? "Пупа" : "Лупа";
    this.channel.send(
      `\`${msg.userId ? `((${name}))` : name}\` ${msg.message}`
    );
  };
  private handleOnDialog = (dialog: any) => {
    this.botIds.push(dialog.botId);
    this.channel.send(`\`кабанчик найден..\``);
  };
  private handleOnClose = () => {
    this.botIds = [];
    this.channel.send(`\`кабанчик сдох..\``);
  };

  public searchDialog = async () => {
    await api.pongChatClient.searchDialogs();
  };

  public closeDialog = async () => {
    await api.pongChatClient.closeDialogs();
  };

  public sendUserMessage = async (botName: string, message: string) => {
    const botId = botName === "пупа" ? this.botIds[0] : this.botIds[1];
    await api.pongChatClient.sendUserMessage(botId, message);
  };

  public dispose = () => {
    for (const event in this.listeners) {
      api.pongChatClient.off(event, this.listeners[event]);
    }
  };
}

const stopChat = async (channelId: string) => {
  const activeChat = activeChats.get(channelId);
  if (activeChat) {
    await activeChat.closeDialog();
    activeChat.dispose();
    activeChats.delete(channelId);
  }
};

const startChat = async (channel: Discord.TextChannel) => {
  let activeChat = activeChats.get(channel.id);
  if (activeChat) {
    await activeChat.closeDialog();
    return activeChat.searchDialog();
  }
  activeChat = new PongChat(channel);
  activeChats.set(channel.id, activeChat);
  return activeChat.searchDialog();
};

const commandor = new Commandor();
commandor
  .command<{ action: "сюда" | "отсюда" }>("кабанчиков [action]")
  .check(({ command: { action }, context }) => {
    if (!["сюда", "отсюда"].includes(action)) {
      context.reply(`кабанчиков либо сюда либо отсюда`);
      return true;
    }
    if (action === "отсюда" && !activeChats.has(context.channel.id)) {
      context.reply("кабанчики уже мертвы.");
      return true;
    }
  })
  .handler(async ({ command: { action }, context }) => {
    switch (action) {
      case "сюда": {
        const isRestart = activeChats.has(context.channel.id);
        await startChat(context.channel as Discord.TextChannel);
        context.reply(
          isRestart ? "кабанчики перенашлись." : "кабанчики запущены."
        );
        break;
      }
      case "отсюда": {
        await stopChat(context.channel.id);
        context.reply("кабанчики отключены.");
        break;
      }
    }
  });

commandor
  .command<{ botName: string }>("ответь [botName]")
  .check(({ command: { botName }, context }) => {
    const words = context.content.split(/\s+/);
    if (!["пупа", "лупа"].includes(botName.toLowerCase())) {
      context.reply("я отвечаю либо за пупу, либо за лупу.");
      return true;
    }
    if (words.length < 3) {
      context.reply("а че ответить то?");
      return true;
    }
    if (!activeChats.has(context.channel.id)) {
      context.reply("если кабанчиков запустишь - отвечу.");
      return true;
    }
  })
  .handler(async ({ command, context }) => {
    const chat = activeChats.get(context.channel.id);
    await chat.sendUserMessage(
      command.botName.toLowerCase(),
      context.content.split(/\s+/).slice(2).join(" ")
    );
    // const botId =
  });
export default commandor;

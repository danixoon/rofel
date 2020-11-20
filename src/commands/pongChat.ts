import { Readable } from "stream";
import * as api from "../api";
import { Commandor } from ".";
import * as Discord from "discord.js";

const activeChats = new Map<
  string,
  { [key: string]: (...args: any[]) => void }
>();

const stopChat = async (channelId: string) => {
  const listeners = activeChats.get(channelId) ?? [];
  await api.pongChatClient.closeDialogs();
  for (const event in listeners) {
    api.pongChatClient.off(event, listeners[event]);
  }
  activeChats.delete(channelId);
};

const startChat = async (channel: Discord.TextChannel) => {
  if (activeChats.has(channel.id)) {
    await api.pongChatClient.closeDialogs();
    await api.pongChatClient.searchDialogs();
    return;
  }
  const handleOnMessage = (msg: any) => {
    channel.send(`\`${msg.senderId}\` ${msg.message}`);
  };
  const handleOnDialog = () => {
    channel.send(`\`кабанчик найден..\``);
  };
  const handleOnClose = () => {
    channel.send(`\`кабанчик сдох..\``);
  };
  const listeners = {
    dialogMessage: handleOnMessage,
    dialogOpened: handleOnDialog,
    dialogClosed: handleOnClose,
  };
  for (const event in listeners) {
    api.pongChatClient.on(event, listeners[event]);
  }
  await api.pongChatClient.searchDialogs();
  activeChats.set(channel.id, listeners);
};

const commandor = new Commandor();
commandor
  .command<{ action: "сюда" | "отсюда" }>("кабанчиков [action]")
  .check(({ command: { action }, context }) => {
    if (!["сюда", "отсюда"].includes(action)) {
      context.reply(`кабанчиков либо сюда либо отсюда`);
      return true;
    }
  })
  .handler(async ({ command: { action }, context }) => {
    switch (action) {
      case "сюда": {
        const isRestart = activeChats.has(context.channel.id);
        await stopChat(context.channel.id);
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
export default commandor;

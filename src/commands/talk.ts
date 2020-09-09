import * as api from "../api";
import { Commandor } from "./";

const commandor = new Commandor();
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

export default commandor;

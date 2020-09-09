import * as api from "../api";
import { Commandor } from "./";

const commandor = new Commandor();
commandor.command("дай").handler(async ({ context }) => {
  const image = await api.reddit.getImage("hmmm");
  context.reply("на", { files: [image] });
});

export default commandor;

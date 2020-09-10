import axios from "axios";
import { RandomReddit } from "random-reddit";
import * as TTS from "@google-cloud/text-to-speech";

export const speech = new TTS.TextToSpeechClient();
export const reddit = new RandomReddit({
  username: process.env.REDDIT_USERNAME,
  password: process.env.REDDIT_PASSWORD,
  app_id: process.env.REDDIT_APP_ID,
  api_secret: process.env.REDDIT_API_SECRET,
  logs: true,
});
const dialogs = new Map<string, [string, string][]>();
export const getAnswer = async (
  question: string,
  displayName: string,
  authorID: string
) => {
  const dialog = dialogs.get(authorID) || [];
  const dialogRequest = dialog
    .map(([req, ans], i) => `request_${i}=${req}&answer_${i}=${ans}`)
    .join("&");

  const getRandomArray = () => {
    let a: number;
    let arr = [];
    for (let i = 0; i < 256; i++) {
      a = i;
      for (let j = 0; j < 8; j++) {
        a = a & 0x1 ? 0xedb88320 ^ (a >>> 0x1) : a >>> 0x1;
      }
      arr[i] = a;
    }
    return arr;
  };

  const crc = (value: string) => {
    let arr = getRandomArray();
    let a = 0x0 ^ -0x1;
    for (let i = 0; i < value.length; i++) {
      a = (a >>> 0x8) ^ arr[(a ^ value.charCodeAt(i)) & 0xff];
    }
    return (a ^ -0x1) >>> 0x0;
  };

  const getCRCSign = (time) => {
    return crc(
      "public-api" +
        time +
        process.env.TALK_KEY1 +
        process.env.TALK_KEY2 +
        process.env.TALK_KEY3
    );
  };

  const getSecretKey = (time: string) => {
    return `a=public-api&b=${crc(time + "b")}&c=${getCRCSign(time)}&d=${crc(
      Date.now() + "d"
    )}&e=${Math.random()}&t=${time}&x=${Math.random() * 10}`;
  };

  const secret = getSecretKey(new Date().getTime().toString());

  const body = `request=${question}&bot_name=кит&user_name=${displayName}${
    dialogRequest ? `&${dialogRequest}` : ""
  }&dialog_lang=ru&${secret}`;

  const answer = await axios.post("http://p-bot.ru/api/getAnswer", body);
  return answer.data.answer as string;
};

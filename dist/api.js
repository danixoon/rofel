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
exports.getAnswer = exports.reddit = exports.speech = void 0;
const axios_1 = require("axios");
const random_reddit_1 = require("random-reddit");
const TTS = require("@google-cloud/text-to-speech");
exports.speech = new TTS.TextToSpeechClient();
exports.reddit = new random_reddit_1.RandomReddit({
    username: process.env.REDDIT_USERNAME,
    password: process.env.REDDIT_PASSWORD,
    app_id: process.env.REDDIT_APP_ID,
    api_secret: process.env.REDDIT_API_SECRET,
    logs: true,
});
const dialogs = new Map();
exports.getAnswer = (question, displayName, authorID) => __awaiter(void 0, void 0, void 0, function* () {
    const dialog = dialogs.get(authorID) || [];
    const dialogRequest = dialog
        .map(([req, ans], i) => `request_${i}=${req}&answer_${i}=${ans}`)
        .join("&");
    const getRandomArray = () => {
        let a;
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
    const crc = (value) => {
        let arr = getRandomArray();
        let a = 0x0 ^ -0x1;
        for (let i = 0; i < value.length; i++) {
            a = (a >>> 0x8) ^ arr[(a ^ value.charCodeAt(i)) & 0xff];
        }
        return (a ^ -0x1) >>> 0x0;
    };
    const getCRCSign = (time) => {
        return crc("public-api" +
            time +
            process.env.TALK_KEY1 +
            process.env.TALK_KEY2 +
            process.env.TALK_KEY3);
    };
    const getSecretKey = (time) => {
        return `a=public-api&b=${crc(time + "b")}&c=${getCRCSign(time)}&d=${crc(Date.now() + "d")}&e=${Math.random()}&t=${time}&x=${Math.random() * 10}`;
    };
    const secret = getSecretKey(new Date().getTime().toString());
    const body = `request=${question}&bot_name=кит&user_name=${displayName}${dialogRequest ? `&${dialogRequest}` : ""}&dialog_lang=ru&${secret}`;
    const answer = yield axios_1.default.post("http://p-bot.ru/api/getAnswer", body);
    return answer.data.answer;
});

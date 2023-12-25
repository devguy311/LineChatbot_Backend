import Line from "@line/bot-sdk";

import { cleanUser } from "./history.js";
import { replyText } from "./openAI.js";

let waitingList = [];

// create LINE SDK config from env variables
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};
// create LINE SDK client
const lineClient = new Line.Client(config);

// register a webhook handler with middleware
// about the middleware, please refer to doc

const lineMiddleware = Line.middleware(config);

// event handler
async function eventHandle(event) {
  console.info("new event", event);

  if (event.type === "unfollow"){
    const userId = event.source.userId;
    cleanUser(userId);
  }

  if (event.type !== "message" || event.message.type !== "text") {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

  if (waitingList.includes(event.source.userId)) {
    return Promise.resolve(null);
  }

  waitingList = [...waitingList, event.source.userId];

  let responseMessage = "";

  try {
    responseMessage = await replyText(event.message.text, event.source.userId, event.replyToken);
  } catch (error) {
    throw error;
  } finally {
    waitingList = waitingList.filter((item) => item != event.source.userId);
  }

  // use reply API
  return lineClient.replyMessage(event.replyToken, responseMessage);
}

export { lineMiddleware, eventHandle, lineClient };

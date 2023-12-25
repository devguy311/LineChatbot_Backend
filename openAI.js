import { Configuration, OpenAIApi } from "openai";
import { set, get, setBiography, isNewUser, saveNewUser } from "./history.js";

const defaultTokens = parseInt(process.env.OPENAI_MAX_TOKENS);
const organizationId = process.env.OPENAI_ORGANIZATION_ID;

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openAI = new OpenAIApi(configuration);

const prompt = `3000文字以上の自叙伝を書きたいです。自叙伝の作成を手伝ってもらえますか？ 私に一文ずつ質問していただければ、質問に私がお答えします。このステップを10回以上繰り返してください。完了したら、私の伝記を優れた、体系的で構造化された自叙伝として出力してください。この時、文字数は3000文字以上である必要があり、出力された自叙伝の最後に##を付けてください。始めましょう! 一文ずつ質問してください。まずは幼少期から教えてください。どこで生まれましたか？ から始めましょう。何でも聞いてみてください。`;
// const openAI = new OpenAIApi(process.env.OPENAI_API_KEY);

async function replyText(message, userId, replyToken) {
  console.info("Asking AI - ", { message, userId, replyToken });
  let messages = [];

  if (await isNewUser(userId) === true) {
    await saveNewUser(userId, "", "", "");
  }

  // get history from redis
  const historyValue = await get(userId);

  // non-first-user
  if (historyValue) {
    messages = JSON.parse(historyValue);
  }

  if (message === '/start' && !historyValue) {
    messages = [
      {
        role: "user",
        content: prompt
      }
    ];
  }
  else if (!historyValue) {
    return { type: "text", text: "開始するには /start を入力してください。" };
  }
  if (message !== '/start')
    setBiography(userId, message);
  // add new message object
  messages = messages.concat([
    {
      role: "user",
      content: message,
    },
  ]);
  let gptResult = {};

  try {
    const options = {
      model: process.env.OPENAI_MODEL ?? "gpt-3.5-turbo",
      messages,
      // max_tokens: isNaN(defaultTokens) ? 500 : defaultTokens,
    };
    // console.info("Create chat completion - ", options);
    // request answer from chatGPT
    const { data } = await openAI.createChatCompletion(options);

    const [choices] = data.choices;

    // console.info("Ai response - ", choices);

    gptResult = { ...choices.message };
  } catch (error) {
    console.log(error.response);
    if (error.response) {
      const { status, statusText, config } = error.response;
      throw {
        name: "chatGPT",
        status,
        statusText,
        userId,
        replyToken,
        requestData: config.data,
      };
    }
    throw { replyToken, error };
  }

  // save history messages to redis
  await set(userId, JSON.stringify(messages.concat([{ ...gptResult, role: "assistant" }])));
  // await setBiography(userId, gptResult);

  // create a echoing text message
  return { type: "text", text: gptResult.content.trim() };
}

export { replyText };

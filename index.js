import express from "express";
import { lineMiddleware, eventHandle, lineClient } from "./line.js";
// import { redisRouter } from "./redis.js";
import { historyRouter } from "./history.js";
import authRouter from "./auth.js";
import cors from "cors";
import mongoose from "mongoose";
import { MongoClient } from "mongodb";
// create Express app
// about Express itself: https://expressjs.com/
const app = express();
const corsOpts = {
  origin: '*',

  methods: [
    'GET',
    'POST',
  ],

  allowedHeaders: [
    'Content-Type',
  ],
};
app.use(cors(corsOpts));
// app.user(bodyParser.json())

// receive line message
app.post("/callback", lineMiddleware, (req, res) => {
  Promise.all(req.body.events.map(eventHandle))
    .then((result) => res.json(result))
    .catch((err) => errorHandle(err, res));
});

app.get('/', (req, res) => {
  res.send('Hey this is my Line chatGPT Bot Server API running 🥳');
});

function errorHandle(error, res) {
  console.error("error", error);
  switch (error.name) {
    case "chatGPT":
      let responseMessage = "Something error on GPT.";
      switch (error.status) {
        case 429:
          responseMessage = "Can't use GPT now. Please try again later.";
          break;
        default:
          break;
      }
      res.json(lineClient.replyMessage(error.replyToken, { type: "text", text: responseMessage }));
      break;
    default:
      res.status(500).end();
      break;
  }
}

app.use("/bio", historyRouter);

app.use("/auth", authRouter);

// const messages = [{ "role": "user", "content": "1" }, { "role": "user", "content": "2" }, { "role": "user", "content": "3" }, { "role": "user", "content": "4" },
//   { "role": "user", "content": "5" }, { "role": "user", "content": "61**##" }];
// const ms = message[message.length - 1].content;
// console.log(ms.slice(ms.length - 4));

// try {
//   const connectionParams = {
//     useNewUrlParser: true,
//     useCreateIndex: true,
//     useUnifiedTopology: true 
//   }
//   mongoose.connect(process.env.DB_URI, connectionParams);
//   console.log("mongodb connected");
// } catch (err) {
//   console.log(err);
// }
try{
  await mongoose.connect(process.env.DB_URI, { useNewUrlParser: true });
  console.log("connected!");
}catch(err){
  console.log(err);
}

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.info(`listening on ${port}`);
});

export default app;
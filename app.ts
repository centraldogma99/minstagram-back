import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import userRouter from "./routes/users"
import postRouter from "./routes/posts"
import imageRouter from "./routes/images"
import dotenv from "dotenv"
import sourceMapSupport from "source-map-support"

sourceMapSupport.install();
dotenv.config();

const app = express();
const portNumber = 9000;

app.use(cors({ origin: ['http://localhost:3000'], credentials: true }));
app.use(cookieParser());

app.use('/users', userRouter);
app.use('/posts', postRouter);
app.use('/images', imageRouter);

app.get('/', (req, res) => {
  res.send("this is minstagram api root(/), It does nothing!")
})

app.listen(portNumber, () => {
  console.log(`Express 서버가 ${portNumber}번 포트에서 실행 중`)
})
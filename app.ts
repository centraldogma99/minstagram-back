import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import userRouter from "./routes/users"
import postRouter from "./routes/posts"
import imageRouter from "./routes/images"
import directRouter from "./routes/directs"
import dotenv from "dotenv"
import sourceMapSupport from "source-map-support"
import startSocketServer from "./modules/startSocketServer"

sourceMapSupport.install();
dotenv.config();

const app = express();
const portNumber = 9000;

app.use(cors({
  origin: ['http://localhost:3000', 'http://ec2-3-131-119-122.us-east-2.compute.amazonaws.com:3000', 'http://dogmadevs.com', 'http://www.dogmadevs.com'], credentials: true
}));
// app.use(cors())
app.use(cookieParser());

app.use('/users', userRouter);
app.use('/posts', postRouter);
app.use('/images', imageRouter);
app.use('/directs', directRouter);

app.get('/', (req, res) => {
  res.send("this is minstagram api root(/), It does nothing!")
})

const server = app.listen(portNumber, () => {
  console.log(`Express 서버가 ${portNumber}번 포트에서 실행 중`)
})

startSocketServer(server)
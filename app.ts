import express from "express"

const app = express();
const portNumber = 9000;

app.listen(portNumber, () => {
  console.log(`Express 서버가 ${portNumber}번 포트에서 실행 중`)
})
import { Server } from "socket.io"
import { chatRoomModel } from "../config/db";
import jwt from "jsonwebtoken"
import { getUserInfo } from "./getUserInfo";
import docToUser from "./docToUser";

const startSocketServer = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000"],
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log("a user connected!");

    socket.on('join', async (roomId: string, credential: string) => {
      try {
        // API를 통해 미리 방을 만들어야 한다.
        const chatRoom = await chatRoomModel.findOne({ "_id": roomId })
        if (!chatRoom) {
          return socket.emit('error', 'Room not found')
        }

        const decoded = jwt.verify(credential, process.env.TOKEN_KEY);
        // 방 안에 포함된 유저여야만 조인 가능
        if (chatRoom.members.includes((<any>decoded)._id)) {
          (<any>socket).userId = (<any>decoded)._id;
          socket.join(roomId);
          socket.emit("joined", roomId, (<any>socket).userId);
          (<any>socket).activeRoom = roomId;
        } else {
          return socket.emit('error', 'Forbidden')
        }
      } catch (e) {
        console.log(e);
      }
    });

    socket.on('messageEvent', async (message: { content: string, timestamp: Date, author?: string }) => {
      console.log('chatEvent');
      message.author = (<any>socket).userId;

      // DB 채팅 추가
      chatRoomModel.updateOne({ "_id": (<any>socket).activeRoom }, {
        $push: {
          "messages": message
        }
      }).exec();

      // 유저에게 돌려주기
      const { content, timestamp } = message;
      const author = docToUser(await getUserInfo(message.author));
      io.to((<any>socket).activeRoom).emit('messageEvent', {
        author,
        content,
        timestamp
      })
    });

    socket.on('disconnect', async (reason) => {
      console.log('disconnect');
      try {
        // 아래 메시지는 테스트 과정에서만 쓸것임
        const message = { author: (<any>socket).userId, content: "님이 퇴장했습니다.", timestamp: new Date() }
        const res = await chatRoomModel.updateOne({ "_id": (<any>socket).activeRoom }, {
          $push: {
            "messages": message
          }
        })
        console.log(res);

        const { content, timestamp } = message;
        const author = docToUser(await getUserInfo(message.author));
        io.to((<any>socket).activeRoom).emit('messageEvent', {
          author,
          content,
          timestamp
        })
      } catch (e) {
        console.error(e);
      }
    })
  })
}

export default startSocketServer
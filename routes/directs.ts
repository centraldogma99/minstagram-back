import express from "express"
import { IChatRoom, IChatMessage } from "../types/chatTypes"
import { chatRoomModel } from "../config/db"
import { getUserInfo } from "../modules/getUserInfo"
import bodyParser from "body-parser"
import docToUser from "../modules/docToUser"

const router = express.Router()

router.use(bodyParser.json());

const preProcessIdFromMessages = async (messages: IChatMessage[]) => {
  return Promise.all(messages.map(async message => {
    const { author, content, timestamp } = message;
    const user = await getUserInfo(author);
    return {
      author: docToUser(user),
      content, timestamp
    }
  }))
}

const preProcessIdFromChatRoom = async (chatRoom: IChatRoom) => {
  if (!chatRoom) return;

  const members = await Promise.all(
    chatRoom.members.map(async member =>
      docToUser(await getUserInfo(member))
    )
  );
  const messages = await preProcessIdFromMessages(chatRoom.messages);

  return {
    _id: chatRoom._id,
    members,
    messages,
    bookmarks: chatRoom.bookmarks
  };
}

const recordBookmark = async (chatRoomId: string, userId: string | string[], index: number) => {
  const chatRoom = await chatRoomModel.findById(chatRoomId);
  if (index === -1) {
    index = chatRoom.messages.length - 1;
  }
  if (Array.isArray(userId)) {
    userId.forEach(uid => {
      chatRoom.members.forEach((id, i) => {
        if (id === uid) {
          chatRoom.bookmarks[i] = index;
        }
      })
    })
  } else {
    chatRoom.members.forEach((id, i) => {
      if (id === userId) {
        chatRoom.bookmarks[i] = index;
      }
    })
  }

  chatRoom.save();
}


// Request Form
// {
//   members: [string]  // list of user _id
// }
router.post('/newRoom', async (req, res) => {
  const { members } = req.body;
  if (!members) return res.status(400).send({ error: 'members is required' });
  if (!Array.isArray(members)) return res.status(400).send({ error: 'members must be an array' });

  for (const member of members) {
    if (!(await getUserInfo(member)))
      return res.status(400).send({ error: "Invalid member" });
  }
  let chatRoom: IChatRoom = await chatRoomModel.findOne({ members: { $all: members } });
  if (chatRoom) return res.send(chatRoom._id)

  chatRoom = await chatRoomModel.create({
    members,
    messages: []
  })

  await recordBookmark(chatRoom._id, members, 0);

  return res.send(chatRoom._id);
})

router.get('/withUsers', async (req, res) => {
  const { userId1, userId2 } = req.query;
  const query = [userId1, userId2].filter(id => id)
  if (query.length === 0) return res.status(400).send({ error: 'userId1 and userId2 are required' });

  const chatRooms: IChatRoom[] = await chatRoomModel.find({ members: { $all: query } });

  if (!chatRooms || chatRooms.length === 0) return res.status(404).send("no such chatroom");

  //TODO 채팅 내역까지 보낼 필요는 없을듯
  return res.json(await Promise.all(chatRooms.map(chatRoom => preProcessIdFromChatRoom(chatRoom))))
})

router.get('/:id', async (req, res) => {
  const chatRoom: IChatRoom = await chatRoomModel.findOne({ _id: req.params.id });
  if (!chatRoom) return res.status(404).send("no such chatroom");

  return res.json(await preProcessIdFromChatRoom(chatRoom))
})

// roomId, userId를 받아, bookmark를 가장 마지막 항목으로 바꾼다.
router.post('/updateBookmark', async (req, res) => {
  const { roomId, userId } = req.body;
  if (!roomId) return res.status(400).send({ error: 'roomId is required' });
  if (!userId) return res.status(400).send({ error: 'userId is required' });

  await recordBookmark(roomId, userId, -1);

  return res.send("successful");
})

export default router;
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
    const { author, ...rest } = message;
    const user = await getUserInfo(author);
    return {
      author: docToUser(user),
      ...rest
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
    messages
  };
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

  return res.send(chatRoom._id);
})

router.get('/withUsers', async (req, res) => {
  const { userId1, userId2 } = req.query;
  const query = [userId1, userId2].filter(id => id)
  if (query.length === 0) return res.status(400).send({ error: 'userId1 and userId2 are required' });

  const chatRooms: IChatRoom[] = await chatRoomModel.find({ members: { $all: query } });
  console.log(chatRooms)
  if (!chatRooms || chatRooms.length === 0) return res.status(404).send("no such chatroom");

  return res.json(await Promise.all(chatRooms.map(chatRoom => preProcessIdFromChatRoom(chatRoom))))
})

router.get('/:id', async (req, res) => {
  const chatRoom: IChatRoom = await chatRoomModel.findOne({ _id: req.params.id });
  if (!chatRoom) return res.status(404).send("no such chatroom");

  return res.json(await preProcessIdFromChatRoom(chatRoom))
})

export default router;
import express from "express";
import { postModel, userModel } from "../config/db";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import bodyParser from "body-parser";
import auth from "../middlewares/auth";
import multer from "multer";
import { uploadImages } from "../modules/handleImage";

import reqUser from "../types/reqUser"

declare global {
  namespace Express {
    interface Request {
      user?: reqUser,
      cookies?: any
    }
  }
}

const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/images');
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname + '-' + Date.now().valueOf());
    }
  }),
});

router.get('/', (req, res) => {
  res.send("hi here is /users");
})

// 내 정보 반환
// FIXME: req any
router.get('/me', auth, async (req: Express.Request, res) => {
  const user = await userModel.findOne({ _id: req.user?._id });
  if (!user) return res.status(404).send("User not found");
  const { _id, name, email, avatar } = user;
  res.json({ _id, name, email, avatar });
})

// FIXME: req any
// 내 프로필 사진을 변경
router.post('/changeProfile', [auth, upload.single('profile-picture')],
  async (req: Express.Request, res) => {
    if (!req.file) return res.status(400).send("no file");
    const picture = req.file;

    const pictureAddrPromises = uploadImages([picture.filename]);
    const pictureAddr = (await Promise.all(pictureAddrPromises))[0];

    const user = await userModel.findOne({ _id: req.user._id });
    if (!user) {
      return res.send(404).send("no matching id");
    }
    user.avatar = pictureAddr;
    await user.save();
    const { _id, name, email, avatar } = user;
    res.json({ _id, name, email, avatar });
  })

// 현재는 인증 구현 안하고 누구나 접근 가능
// id를 받아 해당하는 유저의 정보 반환
router.get('/:id', async (req, res) => {
  try {
    const id = req.params?.id;
    if (!id) return res.status(400).send("bad request: no id");
    const user = await userModel.findOne({ _id: id });
    if (!user) return res.status(404).send("no such user");
    const { _id, name, email, avatar } = user;
    res.json({ _id, name, email, avatar });
  } catch (e) {
    console.error(e);
  }
})

router.get('/:id/posts', async (req, res) => {
  const id = req.params?.id;
  if (!id) return res.status(400).send("bad request: no id");
  const user = await userModel.findOne({ _id: id });
  if (!user) return res.status(404).send("no such user");

  const posts = await postModel.find({ authorId: user._id });
  if (!posts) return res.status(404).send("no posts");
  res.json(posts);
})

router.get('/name/:name', async (req, res) => {
  const nameParam = req.params?.name;
  if (!nameParam) return res.status(400).send("bad request: no name");
  const user = await userModel.findOne({ name: nameParam });
  if (!user) return res.status(404).send("no such user");
  const { _id, name, email, avatar } = user;
  res.json({ _id, name, email, avatar });
})

router.post('/register', bodyParser.json(), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).send("bad request");

    const oldUser = await userModel.findOne({ email });
    if (oldUser) return res.status(409).send("email already registered");

    const encrypted = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      name: name,
      email: email.toLowerCase(),
      password: encrypted,
      avatar: ""
    });
    delete user.password
    res.json(user);
  } catch (e) {
    console.error(e);
  }
});

// 토큰 형식 : _id: objectID(string), email, name
router.post('/login', bodyParser.json(), async (req, res) => {
  console.log('login')
  try {
    console.log(req.body);
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).send("bad request")

    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).send("no such user, you should register");

    if (!await bcrypt.compare(password, user.password))
      return res.status(401).send("invalid credentials");
    const token = jwt.sign(
      { _id: user._id, email: email, name: user.name },
      process.env.TOKEN_KEY as jwt.Secret,
      {
        expiresIn: "1h"
      }
    )

    res.status(200).cookie('credential', token, { maxAge: 3600000 }).json({
      _id: user._id,
      name: user.name,
      avatar: user.avatar,
      email: user.email
    });
  } catch (e) {
    console.error(e);
  }

  router.get('/logout', (req, res) => {
    return res.status(200).clearCookie("credential", { path: '/' }).send("successful");
  })
})

export default router;
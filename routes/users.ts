import express from "express";
import { userModel } from "../config/db";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import bodyParser from "body-parser";
import auth from "../middlewares/auth";
import multer from "multer";
import { uploadImages } from "../modules/handleImage";

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
router.get('/me', auth, (req: any, res) => {
  res.json(req.user);
})

// FIXME: req any
// 내 프로필 사진을 변경
router.post('/changeProfile', [auth, upload.single('profile-picture')],
  async (req: any, res) => {
    const picture = req.file;
    if (!req.file) return res.status(400).send("no file");

    const pictureAddrPromises = uploadImages([picture.filename]);
    const pictureAddr = (await Promise.all(pictureAddrPromises))[0];

    const user = await userModel.findOne({ _id: req.user._id });
    if (!user) {
      return res.send(404).send("no matching id");
    }
    user.avatar = pictureAddr;
    await user.save();

    return res.send(user);
  })

// 현재는 인증 구현 안하고 누구나 접근 가능
// id를 받아 해당하는 유저의 정보 반환
// FIXME: 패스워드까지 뱉고 있다.
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);
    const user = await userModel.findOne({ _id: id });
    if (!user) return res.status(404).send("no such user");
    res.send(user);
  } catch (e) {
    console.error(e);
  }
})

router.post('/register', bodyParser.json(), async (req, res) => {
  try {
    console.log(req.body);
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).send("bad request");

    const oldUser = await userModel.findOne({ email });
    if (oldUser) return res.status(409).send("email already registered");

    const encrypted = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      name: name,
      email: email.toLowerCase(),
      password: encrypted
    });
    res.json(user);
  } catch (e) {
    console.error(e);
  }
});

// 토큰 형식 : _id: objectID(string), email, name
router.post('/login', bodyParser.json(), async (req, res) => {
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

    res.status(200).cookie('credential', token, { maxAge: 3600000 }).json(user);
  } catch (e) {
    console.error(e);
  }

  router.get('/logout', (req, res) => {
    return res.status(200).clearCookie("credential", { path: '/' }).send("successful");
  })
})

export default router;
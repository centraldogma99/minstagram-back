import express from "express";
import { userModel } from "../config/db";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import bodyParser from "body-parser";

const router = express.Router();

router.get('/', (req, res) => {
  res.send("hi here is /users");
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
      { _id: user._id.toString(), email, name: user.name },
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
import jwt from 'jsonwebtoken'

// req.user는 email, name, user_id 포함
const auth = (req: Express.Request, res, next) => {
  // const token = req.body?.token || req.query?.token || req.headers['x-access-token'];
  const token = req.cookies?.credential;
  if (!token) return res.status(403).send("token required");

  try {
    const { _id, email, name } = jwt.verify(token, process.env.TOKEN_KEY) as { _id: string, email: string, name: string };
    // console.log("decoded: " + JSON.parse(decoded as string))
    req.user = {
      _id: _id,
      email: email,
      name: name
    }
  } catch (e) {
    return res.status(401).send('bad token');
  }
  return next();
}

export default auth
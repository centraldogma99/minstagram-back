import jwt from 'jsonwebtoken'

// req.user는 email, name, user_id 포함
// FIXME: req any
const auth = (req: any, res, next) => {
  // const token = req.body?.token || req.query?.token || req.headers['x-access-token'];
  const token = req.cookies?.credential;
  if (!token) return res.status(403).send("token required");

  try {
    const decoded: any = jwt.verify(token, process.env.TOKEN_KEY);
    req.user = {
      _id: decoded._id,
      email: decoded.email,
      name: decoded.name
    }
  } catch (e) {
    return res.status(401).send('bad token');
  }
  return next();
}

export default auth
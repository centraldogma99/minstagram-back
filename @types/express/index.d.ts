import reqUser from "../../types/reqUser"

declare global {
  namespace Express {
    interface Request {
      user: reqUser,
      cookies: any
    }
  }
}
import mongoose from "mongoose";

export interface User {
  _id: mongoose.Types.ObjectId
  name: string,
  email: string,
  password: string,
  avatar: string,
  following?: Array<mongoose.Types.ObjectId>,
  follower?: Array<mongoose.Types.ObjectId>,
  bio?: string,
}
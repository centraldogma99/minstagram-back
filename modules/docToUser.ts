import mongoose from "mongoose";
import { User } from "../types/user";

const docToUser = (user: mongoose.Document<any, any, User> & User & { _id: mongoose.Types.ObjectId }) => {
  if (!user) return null;
  const { _id, email, name, avatar } = user;
  return { _id, email, name, avatar };
}

export default docToUser;
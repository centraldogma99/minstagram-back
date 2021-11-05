import mongoose from "mongoose";
import { User } from "../types/user";

const docToUser = (user: mongoose.Document<any, any, User> & User & { _id: mongoose.Types.ObjectId }) => {
  const { _id, email, name, avatar } = user;
  return { _id, email, name, avatar };
}

export default docToUser;
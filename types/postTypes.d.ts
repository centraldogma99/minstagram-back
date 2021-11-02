import mongoose from "mongoose";
import { User } from "./user";

export interface IComment {
  authorId: string,
  content: string,
  likes: ILike[]
}

export interface ILike {
  authorId: string
}

export interface IPost {
  _id: mongoose.Types.ObjectId,
  // author objectID와 같은 일련번호.
  authorId: string,
  pictures: string[],
  likes: ILike[],
  comments: IComment[],
  text: string
}
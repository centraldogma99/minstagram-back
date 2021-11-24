import mongoose from "mongoose";
import { User } from "./user";

export interface IComment {
  _id: number,
  authorId: string,
  content: string,
  likes: ILike[],
  timestamp: Date
}

export interface ILike {
  authorId: string
}

export interface IPost {
  _id: mongoose.Types.ObjectId,
  authorId: string,
  pictures: string[],
  likes: ILike[],
  comments: IComment[],
  text: string,
  timestamp: Date
}
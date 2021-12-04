import mongoose from "mongoose";
import { IPost, IComment } from "../types/postTypes";
import { User } from "../types/user"
import { IChatRoom, IChatMessage } from "../types/chatTypes";

const chatRoomSchema = new mongoose.Schema<IChatRoom>({
  members: [String],
  messages: [{
    author: String,
    content: String,
    timestamp: Date
  }],
  bookmarks: { type: [Number], default: [0, 0] }
})

const commentSchema = new mongoose.Schema<IComment>({
  _id: Number,
  authorId: String,
  content: String,
  likes: [{ authorId: String }],
  timestamp: Date
})

const postSchema = new mongoose.Schema<IPost>({
  authorId: String,
  pictures: [String],
  likes: [{ authorId: String }],
  text: String,
  comments: [commentSchema],
  timestamp: Date
})

const userSchema = new mongoose.Schema<User>({
  avatar: String,
  name: String,
  email: String,
  password: String,
  following: [String],
  follower: [String],
  bio: { type: String, default: "" }
})

const imageSchema = new mongoose.Schema({
  filename: String,
  accessAddress: String
})

mongoose.connect("mongodb://localhost:27017/minstagram");
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.on("open", () => {
  console.log("데이터베이스 연결 성공");
});
db.on("disconnected", () => {
  console.log("데이터베이스와 연결 끊어짐");
  // setTimeout(this.connectDB, 5000);
});

export const postModel = mongoose.model("posts", postSchema);
export const userModel = mongoose.model("users", userSchema);
export const imageModel = mongoose.model("images", imageSchema);
export const chatRoomModel = mongoose.model("chatRooms", chatRoomSchema);
export const commentModel = mongoose.model("comments", commentSchema);
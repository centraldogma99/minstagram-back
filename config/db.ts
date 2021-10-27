import mongoose from "mongoose";
import { IPost } from "../types/postTypes";
import { User } from "../types/user"


const postSchema = new mongoose.Schema<IPost>({
  authorId: String,
  pictures: [String],
  likes: [{ authorId: String }],
  comments: [{
    authorId: String,
    content: String,
    likes: [{ authorId: String }]
  }]
})

const userSchema = new mongoose.Schema<User>({
  name: String,
  email: String,
  password: String
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
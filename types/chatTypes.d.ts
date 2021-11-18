import mongoose from "mongoose"

export interface IChatRoom {
  _id: string;
  members: string[];
  messages: IChatMessage[];
  // 마지막으로 로드했을 때의 messages인덱스
  bookmarks: number[]
}

export interface IChatMessage {
  author: string;
  content: string;
  timestamp: Date;
}
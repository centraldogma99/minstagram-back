import mongoose from "mongoose"

export interface IChatRoom {
  _id: string;
  members: string[];
  messages: IChatMessage[];
}

export interface IChatMessage {
  author: string;
  content: string;
  timestamp: Date;
}
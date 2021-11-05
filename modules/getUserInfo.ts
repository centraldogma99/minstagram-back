import { userModel } from "../config/db";

export const getUserInfo = async (id: string) => {
  if (!id) return;
  const user = await userModel.findOne({ _id: id });
  if (!user) return;
  return user;
}
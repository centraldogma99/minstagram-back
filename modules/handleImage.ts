import { imageModel } from "../config/db";
import randomString from "./randomString";

// only internal use
export const uploadImages = (pictureNames: string[]) => {
  return pictureNames.map(async pictureName => {
    let isOccupied = true;
    let randomStr = ""
    while (isOccupied) {
      randomStr = randomString(8);
      const res = await imageModel.find({ accessAddress: randomStr });
      isOccupied = res.length > 0;
    }

    const data = new imageModel({
      accessAddress: randomStr,
      filename: pictureName
    })

    await data.save();
    return randomStr;
  })
}

// only internal use
export const getImage = (accessAddress: string) => {
  return imageModel.findOne({ accessAddress: accessAddress })
}
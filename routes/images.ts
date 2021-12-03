import express from "express";
import { imageModel } from "../config/db";
import path from 'path';

const router = express.Router();

// for testing
router.get('/:id', (req, res) => {
  const id = req.params.id;
  let p = "";
  if (process.argv.includes('--develop')) {
    p = `${__dirname}/../uploads`;
  } else {
    p = `${__dirname}/../../uploads`;
  }
  imageModel.findOne({ accessAddress: id }, (err, data) => {
    if (err) {
      return res.status(404).send("Not Found");
    }
    if (data) {
      return res.sendFile(path.resolve(`${p}/images/${data.filename}`));
    } else {
      // res.status(404).send("Not Found");
      return res.sendFile(path.resolve(`${p}/assets/defaultProfile.png`));
    }
  });
})

export default router;
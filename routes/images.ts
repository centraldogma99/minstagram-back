import express from "express";
import { imageModel } from "../config/db";
import path from 'path';

const router = express.Router();

// for testing
router.get('/:id', (req, res) => {
  const id = req.params.id;
  imageModel.findOne({ accessAddress: id }, (err, data) => {
    if (err) {
      return res.status(404).send("Not Found");
    }
    if (data) {
      return res.sendFile(path.resolve(`${__dirname}/../../uploads/images/${data.filename}`));
    } else {
      // res.status(404).send("Not Found");
      return res.sendFile(path.resolve(`${__dirname}/../../uploads/assets/defaultProfile.png`));
    }
  });
})

export default router;
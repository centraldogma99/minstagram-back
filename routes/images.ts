import express from "express";
import { imageModel } from "../config/db";
import path from 'path';

const router = express.Router();

// for testing
router.get('/:id', (req, res) => {
  const id = req.params.id;
  imageModel.findOne({ accessAddress: id }, (err, data) => {
    if (err) {
      res.status(500).send("Internal Server Error");
    } else if (data) {
      res.sendFile(path.resolve(`${__dirname}/../uploads/images/${data.filename}`));
    } else {
      res.status(404).send("Not Found");
    }
  });
})

export default router;
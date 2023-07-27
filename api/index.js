const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();

mongoose.connect(process.env.MONGO_DB_URL);
const jwtSecret = process.env.JWT_SECRET;

const app = express();

app.get("/test", (req, res) => {
  res.json("test ok");
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const createdUser = await User.create({ username, password });
  jwt.sign({ userId: createdUser._id }, jwtSecret),
    (err, token) => {
      if (err) throw err;
      res.cookie("token", token).status(201).json("ok");
    };
});
app.listen(4000);

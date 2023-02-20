const express = require("express");
const mongoose = require("mongoose");
const userRoutes = require("./Routes/User");
const adminRoutes = require("./Routes/Admin");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
require("dotenv").config();

//Middleware

app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use("/user", userRoutes);
app.use("/", adminRoutes);

//Database Connection

mongoose.set("strictQuery", false);
mongoose
  .connect("mongodb://127.0.0.1/CarRentals")
  .then(() => {
    app.listen(5000);
    console.log("Database Connected to Port 5000!!");
  })
  .catch((err) => console.log(err));

require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");

const app = express();

// connect to database
connectDB();

// start server
app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
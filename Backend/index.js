require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

const { UserRouter } = require("./routers/user"); // Routing in express
const { CourseRouter } = require("./routers/course");
const { adminRouter } = require("./routers/admin");

const app = express();
const port = 3001;
app.use(express.json());


app.use("/api/v1/user", UserRouter);
app.use("/api/v1/course", CourseRouter);
app.use("/api/v1/admin", adminRouter);


async function main() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to MongoDB");
        app.listen(3001, () => {
            console.log("Server is running on port 3001");
        });
    } catch (err) {
        console.error("MongoDB connection error:", err);
    }
}
main();

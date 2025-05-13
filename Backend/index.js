require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const { UserRouter } = require("./routers/user"); // Routing in express
const { CourseRouter } = require("./routers/course");
const { adminRouter } = require("./routers/admin");

const app = express();
const port = 3001;

// CORS configuration
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500'], // Add your frontend URLs
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'token'],
    credentials: true
}));

app.use(express.json());

// Routes
app.use("/api/v1/user", UserRouter);
app.use("/api/v1/course", CourseRouter);
app.use("/api/v1/admin", adminRouter);

async function main() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to MongoDB");
        app.listen(port, () => {
            console.log("Server is running on " + port);
        });
    } catch (err) {
        console.error("MongoDB connection error:", err);
    }
}
main();

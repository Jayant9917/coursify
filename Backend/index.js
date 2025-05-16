require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const { UserRouter } = require("./routers/user"); // Routing in express
const { CourseRouter } = require("./routers/course");
const { adminRouter } = require("./routers/admin");

const app = express();
const port = process.env.PORT || 3002;

// CORS configuration
app.use(cors({
    origin: [
        'http://localhost:5500', 
        'http://127.0.0.1:5500', 
        'https://coursify-repw.onrender.com',
        'https://coursify-frontend-f90i.onrender.com'  // Your new frontend URL
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'token'],
    credentials: true
}));

app.use(express.json());

// Root route
app.get('/', (req, res) => {
    res.json({
        message: "Welcome to Coursify API",
        status: "Server is running",
        endpoints: {
            user: "/api/v1/user",
            course: "/api/v1/course",
            admin: "/api/v1/admin"
        }
    });
});

// Routes
app.use("/api/v1/user", UserRouter);
app.use("/api/v1/course", CourseRouter);
app.use("/api/v1/admin", adminRouter);

async function main() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to MongoDB");
        
        const server = app.listen(port, () => {
            console.log("Server is running on port " + port);
        });

        // Handle server errors
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`Port ${port} is already in use. Please try a different port or close the application using this port.`);
                process.exit(1);
            } else {
                console.error('Server error:', error);
            }
        });

    } catch (err) {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    }
}

main();

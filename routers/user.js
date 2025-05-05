// const express = require("express");
// const UserRouter = express.Router();

const{ Router } = require("express");
const UserRouter = Router();

// SignUp Route
UserRouter.post("/signup", (req, res) => {
    res.json({
        msg: "You are signed up"
    });
});

// SignIn Route
UserRouter.post("/signin", (req, res) => {
    res.json({
        msg: "You are signed in"
    });
});

// Get all purchases
UserRouter.get("/purchases", (req, res) => {
    res.json({
        msg: "Your purchased courses"
    });
});

module.exports = {
    UserRouter
};

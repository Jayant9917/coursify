// Other way for router
//const { Router } = require("express");

const express = require("express");
const  Router  = express.Router();

const UserRouter = Router();

//SignUp Route
UserRouter.post("/Signup", (req, res) => {
        res.json({
            msg : "you are sign Up"

    })
});

// SignIn Route
UserRouter.post("/SignIn", (req, res) => {
        res.json({
            msg : "you are sign In"

    })
});

// Gat all purchases
UserRouter.get("/purchases", (req, res) => {
        res.json({
            msg : "Your all courses"
    })
})

module.exports = {
    UserRouter : UserRouter
};


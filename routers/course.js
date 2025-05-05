const express = require("express");
const Router = express.Router();

// const { Router } = require("express");

const CourseRouter = Router();

CourseRouter.post("/purchase", (req, res) => {
    res.json({
        msg : "he want to buy"
    })
})


CourseRouter.get("/preview", (req, res) => {
    res.json({
        msg : "All courses"
    })
});

module.exports = {
    CourseRouter : CourseRouter
};

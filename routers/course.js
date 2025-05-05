// const express = require("express");
// const CourseRouter = express.Router();

const{ Router } = require("express");
const CourseRouter = Router();


CourseRouter.post("/purchase", (req, res) => {
    res.json({
        msg: "Course purchased"
    });
});

CourseRouter.get("/preview", (req, res) => {
    res.json({
        msg: "All courses preview"
    });
});

module.exports = {
    CourseRouter
};

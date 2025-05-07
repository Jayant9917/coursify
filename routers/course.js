// const express = require("express");
// const CourseRouter = express.Router();

const{ Router } = require("express");
const CourseRouter = Router();

const { courseModel } = require("../db");


CourseRouter.post("/purchase", userMiddleware, async (req, res) => {
    // When the user wants to buy a course
    //you can expect the user to pay you the price of the course
    // No complication for razorpay

    const { courseId } = req.body;
    const userId = req.userId;

    // You can also check if the user already buy this cousres
    // avoid buy something again

        await courseModel.create({
                userId : userId,
                courseId : courseId
        })
    
        res.json({
            msg: "You have succesfull Bought the course"
        })
    });


CourseRouter.get("/preview", async (req, res) => {
    const courses = await courseModel.find({});

    res.json({
        courses
    })
});

module.exports = {
    CourseRouter
};

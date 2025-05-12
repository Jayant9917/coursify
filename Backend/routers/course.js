// const express = require("express");
// const CourseRouter = express.Router();

const{ Router } = require("express");
const CourseRouter = Router();

const { courseModel, purchaseModel } = require("../db");
const { userMiddleware } = require("../middleware/user");

CourseRouter.post("/purchase", userMiddleware, async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.userId;

        // Check if course exists
        const course = await courseModel.findById(courseId);
        if (!course) {
            return res.status(404).json({
                msg: "Course not found"
            });
        }

        // Check if already purchased
        const existingPurchase = await purchaseModel.findOne({
            userId,
            courseId
        });

        if (existingPurchase) {
            return res.status(400).json({
                msg: "Course already purchased"
            });
        }

        await purchaseModel.create({
            userId,
            courseId
        });
    
        res.json({
            msg: "You have successfully purchased the course"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            msg: "Something went wrong during purchase"
        });
    }
});

CourseRouter.get("/preview", async (req, res) => {
    try {
        const courses = await courseModel.find({});
        res.json({
            courses
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            msg: "Something went wrong while fetching courses"
        });
    }
});

module.exports = {
    CourseRouter
};

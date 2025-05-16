const{ Router } = require("express");
const UserRouter = Router();

const { userModel, purchaseModel, courseModel } = require("../db")
const { z } = require("zod");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_USER_PASSWORD } = require("../config");
const { userMiddleware } = require("../middleware/user");

// SignUp Route
UserRouter.post("/signup", async (req, res) => {
    try {
        const requireBody = z.object({
            email : z.string().min(3).max(100).email(),
            firstName: z.string().min(3).max(100),
            lastName: z.string().min(3).max(100),
            password : z.string().min(3).max(100)
            .refine((val) => /[a-z]/.test(val), {
                message: "Password must contain at least one lowercase letter"
            })
            .refine((val) => /[A-Z]/.test(val), {
                message: "Password must contain at least one uppercase letter"
            })
            .refine((val) => /[^a-zA-Z0-9]/.test(val), {
                message: "Password must contain at least one special character"
            })
        });
        const parseDataWithSuccess = requireBody.safeParse(req.body);

        if (!parseDataWithSuccess.success) { 
            res.status(400).json({
                msg: "Incorrect Format",
                error: parseDataWithSuccess.error
            });
            return
        }

        const { email, password, firstName, lastName } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        await userModel.create({
            email: email,
            password: hashedPassword,
            firstName : firstName,
            lastName : lastName
        });

        res.json({
            message: "You are signed up"
        });
    }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: "Something went wrong during signup" });
    } 
});

// SignIn Route
UserRouter.post("/signin", async (req, res) => {
    try{
        const { email, password} = req.body;

        const user = await userModel.findOne({
            email : email
        });
        if (!user){
            res.status(403).json({
                "msg" : "user does not exist in db"
            })
            return
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (passwordMatch) {
            const token = jwt.sign({
            id: user._id.toString()
        }, JWT_USER_PASSWORD)
        
        res.json({
            token
        })
    } else {
        res.status(403).json({
            message: "Incorrect creds"
        })
    }
    }catch(error){
        console.error(error);
        res.status(500).json({ error: "Something went wrong" });
    }
});

// Get all purchases
UserRouter.get("/purchases", userMiddleware, async(req, res) => {
    try {
        const userId = req.userId;

        const purchases = await purchaseModel.find({
            userId,
        });

        let purchasedCourseIds = [];

        for (let i = 0; i<purchases.length;i++){ 
            purchasedCourseIds.push(purchases[i].courseId)
        }

        const coursesData = await courseModel.find({
            _id: { $in: purchasedCourseIds }
        });

        res.json({
            purchases,
            coursesData
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            msg: "Something went wrong while fetching purchases"
        });
    }
});

module.exports = {
    UserRouter
};

// const express = require("express");
// const UserRouter = express.Router();
// const express = require("express");
// const UserRouter = express.Router();

const{ Router } = require("express");
const UserRouter = Router();

const { userModel } = require("../db")
const { z } = require("zod");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


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

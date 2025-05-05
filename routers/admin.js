const { Router } = require("express");
const adminRouter = Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const { adminModel } = require("../db")

// adminRouter.use(adminMiddleware);

// SignUp Route
adminRouter.post("/signup", async (req, res) => {
    try {
        const requireBody = z.object({
            email : z.string().min(3).max(100).email(),
            name : z.string().min(3).max(100),
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

        const { email, password, name } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        await adminModel.create({
            email: email,
            password: hashedPassword,
            name: name
        });

        res.json({
            message: "You are signed up"
        });
    }
        catch (error) {
        res.status(500).json({ error: "Something went wrong during signup" });
    } 
});

// SignIn Route
adminRouter.post("/signin", async (req, res) => {
    try{
        const { email, password} = req.body;

        const response = await adminModel.findOne({
            email : email,
        });
        if (!response){
            res.status(403).json({
                "msg" : "user does not exist in db"
            })
            return
        }
        const passwordMatch = await bcrypt.compare(password, response.password);
        if (passwordMatch) {
            const token = jwt.sign({
            id: response._id.toString()
        }, JWT_SECRET)
        
        res.json({
            token
        })
    } else {
        res.status(403).json({
            message: "Incorrect creds"
        })
    }
    }catch(error){
        res.status(500).json({ error: "Something went wrong" });
    }
});



adminRouter.post("/course", (req, res) => {
    res.json({
        msg: "You are signed in"
    });
});

adminRouter.put("/course", (req, res) => {
    res.json({
        msg: "You are signed in"
    });
});

adminRouter.get("/course/bulk", (req, res) => {
    res.json({
        msg: "You are signed in"
    });
});

module.exports = {
    adminRouter
}
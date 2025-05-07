const { Router } = require("express");
const adminRouter = Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const { adminModel, courseModel } = require("../db")
const { JWT_ADMIN_PASSWORD } = require("../config");
const { adminMiddleware } = require("../middleware/admin");


// adminRouter.use(adminMiddleware);

// SignUp Route
adminRouter.post("/signup", async (req, res) => {
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
        console.error(error);
        res.status(500).json({ error: "Something went wrong during signup" });
    } 
});

// SignIn Route
adminRouter.post("/signin", async (req, res) => { 
    try{
        const { email, password} = req.body;

        const admin = await adminModel.findOne({
            email : email,
        });
        if (!admin){
            res.status(403).json({
                "msg" : "user does not exist in db"
            })
            return
        }
        const passwordMatch = await bcrypt.compare(password, admin.password);
        if (passwordMatch) {
            const token = jwt.sign({
            id: admin._id.toString()
        }, JWT_ADMIN_PASSWORD)
        
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

// Create a course in DB
adminRouter.post("/course", adminMiddleware, async (req, res) => {
    const adminId = req.userId;

    const { title, description, imageUrl, price } = req.body;

    // Creating a saas in 6 hours
    const course = await  courseModel.create({
        title : title, 
        description : description,
        imageUrl : imageUrl, 
        price : price, 
        creatorId : adminId
    })
    res.json({
        msg : "course created",
        courseId: course._id
    })
});

// Update a course in DB
adminRouter.put("/course", adminMiddleware, async (req, res) => {
    const adminId = req.userId;

    const { title, description, imageUrl, price, courseId } = req.body;

    // Thisis the logic for not the other admin can edit someone else's course
    // const course = await  courseModel.findOne({
    //     _id : courseId,
    //     creatorId : adminId
    // });

    // if (!course){
    //     res.status(403).json({
    //         "msg" : "course does not exist in db"
    //     })
    //     return
    // }

    const course = await  courseModel.updateOne({
        _id : courseId,
        creatorId : adminId
    },{
        title : title, 
        description : description,
        imageUrl : imageUrl, 
        price : price, 
        creatorId : adminId
    })
    res.json({
        msg : "course Updated",
        courseId: course._id
    })
});

adminRouter.get("/course/bulk", adminMiddleware, async(req, res) => {
    const adminId = req.userId;
    const courses = await  courseModel.find({
        creatorId : adminId
    });
    res.json({
        msg : "all courses",
        courses
    })
    
});

module.exports = {
    adminRouter
}

//681acd334986bd902afd5f96
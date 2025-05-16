const { Router } = require("express");
const adminRouter = Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const { adminModel, courseModel } = require("../db")
const { JWT_ADMIN_PASSWORD } = require("../config");
const { adminMiddleware } = require("../middleware/admin");


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

        const { email, password, firstName, lastName } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        await adminModel.create({
            email: email,
            password: hashedPassword,
            firstName: firstName,
            lastName: lastName
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
    try {
        const adminId = req.userId;
        const { title, description, imageUrl, price } = req.body;

        // Validate course data
        if (!title || !description || !price) {
            return res.status(400).json({
                msg: "Missing required fields"
            });
        }

        if (typeof price !== 'number' || price < 0) {
            return res.status(400).json({
                msg: "Invalid price"
            });
        }

        const course = await courseModel.create({
            title,
            description,
            imageUrl,
            price,
            creatorId: adminId
        });

        res.json({
            msg: "Course created successfully",
            courseId: course._id
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            msg: "Something went wrong while creating course"
        });
    }
});

// Update a course in DB
adminRouter.put("/course/:courseId", adminMiddleware, async (req, res) => {
    try {
        const adminId = req.userId;
        const courseId = req.params.courseId;
        const { title, description, imageUrl, price } = req.body;

        // Validate course data
        if (!title || !description || !price) {
            return res.status(400).json({
                msg: "Missing required fields"
            });
        }

        if (typeof price !== 'number' || price < 0) {
            return res.status(400).json({
                msg: "Invalid price"
            });
        }

        // Check if course exists and belongs to admin
        const course = await courseModel.findOne({
            _id: courseId,
            creatorId: adminId
        });

        if (!course) {
            return res.status(404).json({
                msg: "Course not found or you don't have permission to update it"
            });
        }

        const updatedCourse = await courseModel.updateOne(
            {
                _id: courseId,
                creatorId: adminId
            },
            {
                title,
                description,
                imageUrl,
                price
            }
        );

        res.json({
            msg: "Course updated successfully",
            courseId: courseId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            msg: "Something went wrong while updating course"
        });
    }
});

adminRouter.get("/course/bulk", adminMiddleware, async(req, res) => {
    try {
        const adminId = req.userId;
        const courses = await courseModel.find({
            creatorId: adminId
        });
        res.json({
            msg: "Courses retrieved successfully",
            courses: courses || []
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            msg: "Something went wrong while fetching courses"
        });
    }
});

// Get all courses for admin view
adminRouter.get("/courses/all", adminMiddleware, async(req, res) => {
    try {
        const courses = await courseModel.find({});
        res.json({
            msg: "All courses retrieved successfully",
            courses
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            msg: "Something went wrong while fetching all courses"
        });
    }
});

// Get a single course
adminRouter.get("/course/:courseId", adminMiddleware, async (req, res) => {
    try {
        const adminId = req.userId;
        const courseId = req.params.courseId;

        const course = await courseModel.findOne({
            _id: courseId,
            creatorId: adminId
        });

        if (!course) {
            return res.status(404).json({
                msg: "Course not found or you don't have permission to access it"
            });
        }

        res.json({
            msg: "Course retrieved successfully",
            course
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            msg: "Something went wrong while fetching course"
        });
    }
});

// Delete a course
adminRouter.delete("/course/:courseId", adminMiddleware, async (req, res) => {
    try {
        const adminId = req.userId;
        const courseId = req.params.courseId;

        // Check if course exists and belongs to admin
        const course = await courseModel.findOne({
            _id: courseId,
            creatorId: adminId
        });

        if (!course) {
            return res.status(404).json({
                msg: "Course not found or you don't have permission to delete it"
            });
        }

        await courseModel.deleteOne({
            _id: courseId,
            creatorId: adminId
        });

        res.json({
            msg: "Course deleted successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            msg: "Something went wrong while deleting course"
        });
    }
});

module.exports = {
    adminRouter
}


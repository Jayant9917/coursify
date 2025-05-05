const { Router } = require("express");
const adminRouter = Router();

adminRouter.use(adminMiddleware);

// SignUp Route
adminRouter.post("/signup", (req, res) => {
    res.json({
        msg: "You are signed up"
    });
});

// SignIn Route
adminRouter.post("/signin", (req, res) => {
    res.json({
        msg: "You are signed in"
    });
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
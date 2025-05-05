const express = require("express");
const { UserRoutes } = require("./user")
const app = express();
const port = 3001;

app.post("/Signup", (req, res) => {
    res.json({
        msg : "you are sign Up"
    })
});


app.post("/SignIn", (req, res) => {
    res.json({
        msg : "you are sign In"
    })
});

app.get("/purchases", (req, res) => {
    res.json({
        msg : "Your all courses"
    })
})

app.post("/purshase", (req, res) => {
    res.json({
        msg : "he want to buy"
    })
})


app.get("/courses", (req, res) => {
    res.json({
        msg : "All courses"
    })
});

app.listen(prompt, () => {
    console.log(`Server is running on ${port}`)
});
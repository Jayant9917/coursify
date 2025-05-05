const express = require("express");
const { UserRouter } = require("./routers/user"); //Routing in express
const { CourseRouter } = require("./routers/course");

const app = express();
const port = 3001;

app.use(express.json());

app.use("/user", UserRouter);
app.use("/course", CourseRouter);


app.listen(port, () => {
    console.log(`Server is running on ${port}`)
});
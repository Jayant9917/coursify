const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://admin:jayant132465rana@cluster0.cty7ree.mongodb.net/coursify-app")
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection error:", err));

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const userSchema = new Schema({
    email : {type : String, unique : true},
    password : String,
    firstName : String,
    lastName : String
});

const adminSchema = new Schema({
    email : {type : String, unique : true},
    password : String,
    firstName : String,
    lastName : String
});

const courseSchema = new Schema({
    title: String,
    description : String,
    price : Number,
    imageUrl : String,
    creatorId : ObjectId
});

const purchaseSchema = new Schema({
    userId : ObjectId,
    courseId : ObjectId
});

const userModel = mongoose.model('user', userSchema);
const adminModel = mongoose.model('admin', adminSchema);
const courseModel = mongoose.model('course', courseSchema);
const purchaseModel = mongoose.model('purchase', purchaseSchema);

module.exports = {
    userModel,
    adminModel,
    courseModel,
    purchaseModel
};
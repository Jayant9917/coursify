const mongoose = require("mongoose");


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
    creatorId : { type: ObjectId, required: false }
});

const purchaseSchema = new Schema({
    userId : { type : ObjectId, ref : 'user'},
    courseId : { type : ObjectId, ref : 'course'}
})

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
const mongoose = require("mongoose");


const productSchema = new mongoose.Schema({

title:{
type:String,
required:true
},


description:{
type:String,
default:""
},


price:{
type:Number,
required:true
},


image:{
type:String,
default:""
},


category:{
type:String,
default:"عام"
},


rating:{
type:Number,
default:5
},


stock:{
type:Number,
default:10
},


createdAt:{
type:Date,
default:Date.now
}


});


module.exports = mongoose.model(
"Product",
productSchema
);
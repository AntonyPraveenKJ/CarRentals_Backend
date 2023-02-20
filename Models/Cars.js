const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const carSchema = new Schema({
    name:{
        type:String,
        required:true
    },
    brand:{
        type:String,
        required:true
    },
    segment:{
        type:String,
        required:true
    },
    image:{
        type:Array,
        required:true
    }
})

module.exports = mongoose.model('Cars',carSchema);
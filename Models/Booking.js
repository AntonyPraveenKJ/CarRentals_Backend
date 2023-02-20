const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    carId: {
      type:mongoose.Schema.Types.ObjectId,
      required:true
    },
    date: {
      type: String,
      required: true
    },
    location: {
      type: String,
      required: true
    },
    status: {
      type: String,
      required:true
    }
  });
  
  module.exports =mongoose.model('Bookings', bookingSchema);
const Cars=require('../Models/Cars');
const Bookings=require('../Models/Booking');
const moment=require("moment")
const {ObjectId}=require('mongodb');
var objectId=require('mongodb').ObjectId;

//booking

const booking=async(req,res,next)=>{
    const{carId,location,date}=req.body;
    console.log(carId,location,date)
    let anyCars;
    try{
       anyCars=await Bookings.findOne({date:date,location:location,carId:carId});
    }catch(err){
        console.log(err);
    }

    if(anyCars){
      return res.status(400).json({message:"This car already booked on this date"})
    }

    const newBooking=new Bookings({
       carId:carId,
       date:date,
       location:location,
       status:'confirmed'
    });

    try{
      await newBooking.save()
     }catch(err){
      console.log(err)
     }
     console.log(newBooking.date,'date at the time of adding')
     return res.status(200).json({message:newBooking});
};

//Get the details of the cars

const getCarDetails = async (req, res, next) => {
  const { date, location } = req.query;
  
  console.log(date,'getCarDetails Date');
  
  let cars;
  try {
    cars = await Cars.aggregate([
      {
        $lookup: {
          from: "bookings",
          localField: "_id",
          foreignField: "carId",
          as: "bookings",
        },
      },
      {
        $facet: {
          bookedCars: [
            {
              $match: {
                bookings: {
                  $elemMatch: {
                    date: date,
                    location: location,
                  },
                },
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
                brand: 1,
                segment: 1,
                image: 1,
                booked:"true",
              },
            },
          ],
          availableCars: [
            {
              $match: {
                bookings: {
                  $not: {
                    $elemMatch: {
                      date: date,
                      location: location,
                    },
                  },
                },
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
                brand: 1,
                segment: 1,
                image: 1,
                booked:"false",
              },
            },
          ],
        },
      },
      {
        $project: {
          cars: {
            $concatArrays: ["$bookedCars", "$availableCars"],
          },
        },
      },
    ]).exec();
    console.log(cars)
    return res.status(200).json({cars})
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.booking=booking;
exports.getCarDetails=getCarDetails;
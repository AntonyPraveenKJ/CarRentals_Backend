const express=require('express');
const { booking, getCarDetails } = require('../Controllers/userControllers');
const router=express.Router();

router.post('/bookCar',booking);
router.get('/getCars',getCarDetails);

module.exports=router;
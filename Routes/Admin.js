const express = require("express");
const router = express.Router();
const multer = require("multer");
const {  login, getAdmin, verifyToken, refreshToken, logout, addCar, getCars, getDetails, editDetails, deleteCar } = require("../Controllers/adminControllers");
const upload = multer({ dest: "uploads/" });

router.post('/login',login);
router.get('/home',verifyToken,getAdmin);
router.get('/refresh',refreshToken,verifyToken,getAdmin);
router.post('/logout',verifyToken,logout);
router.post('/addNewCar',upload.single('image'),addCar);
router.get('/getAllCars',getCars);
router.get('/getDetails/:id',getDetails);
router.put('/editDetails',upload.single('image'),editDetails);
router.put('/deleteCar/:id',deleteCar);


module.exports = router;

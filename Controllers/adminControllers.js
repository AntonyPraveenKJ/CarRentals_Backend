const Admin=require("../Models/AdminModel");
const Cars=require("../Models/Cars");
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const {ObjectId}=require('mongodb');
var objectId=require('mongodb').ObjectId
const {
  S3Client,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");

const fs = require("fs");
const region =process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey =process.env.AWS_SECRET_KEY;
const bucketName =process.env.AWS_BUCKET_NAME;

const s3 = new S3Client({
  region: region,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
});


  // Admin Login

const login = async (req, res, next) => {
    const { email, password } = req.body;
    let existingAdmin;
  
    try {
      existingAdmin = await Admin.findOne({ email: email });
    } catch (err) {
      return new Error(err);
    }
  
    if (!existingAdmin) {
      return res
        .status(400)
        .json({ message: "Admin not found!!" });
    }
  
    const isPasswordCorrect = bcrypt.compareSync(password, existingAdmin.password);
  
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid Password!!!" });
    }
  
    const token = jwt.sign({ id: existingAdmin._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "35s",
    });
    console.log("Generated Token\n", token);
  
    if (req.cookies[`${existingAdmin._id}`]) {
      req.cookies[`${existingAdmin._id}`] = "";
    }
  
    res.cookie(String(existingAdmin._id), token, {
      path: "/",
      expires: new Date(Date.now() + 1000 * 30),
      httpOnly: true,
      sameSite: "lax",
    });
  
    return res
      .status(200)
      .json({ message: "Successfully LoggedIn", admin: existingAdmin, token });
  };
  
  // Verify Token
  
  const verifyToken = (req, res, next) => {
    const cookies = req.headers.cookie;
    const token = cookies.split("=")[1];
    console.log(token);
  
    if (!token) {
      return res.status(400).json({ message: "No Token Found" });
    }
  
    jwt.verify(String(token), process.env.JWT_SECRET_KEY, (err, admin) => {
      if (err) {
        return res.status(400).json({ message: "Invalid Token" });
      }
      req.id = admin.id;
    });
    next();
  };
  
  // Get Admin
  
  const getAdmin = async (req, res, next) => {
    const adminId = req.id;
    let admin;
  
    try {
      admin = await Admin.findById(adminId, "-password");
    } catch (err) {
      return new Error(err);
    }
  
    if (!admin) {
      return res.status(404).json({ message: "Admin not Found" });
    }
    return res.status(200).json({ message: admin });
  };
  
  // Refresh Token
  
  const refreshToken = (req, res, next) => {
    const cookies = req.headers.cookie;
    const prevToken = cookies.split("=")[1];
  
    if (!prevToken) {
      return res.status(400).json({ message: "No Token Found" });
    }
    jwt.verify(String(prevToken), process.env.JWT_SECRET_KEY, (err, admin) => {
      if (err) {
        console.log(err);
        return res.status(403).json({ message: "Authentication Failed" });
      }
      res.clearCookie(`${admin.id}`);
      req.cookies[`${admin.id}`] = "";
  
      const token = jwt.sign({ id: admin.id }, process.env.JWT_SECRET_KEY, {
        expiresIn: "35s",
      });
  
      console.log("Regenerated token\n", token);
  
      res.cookie(String(admin.id), token, {
        path: "/",
        expires: new Date(Date.now() + 1000 * 30),
        httpOnly: true,
        sameSite: "lax",
      });
      req.id = admin.id;
    });
    next();
  };
  
  // Admin Logout
  
  const logout = (req, res, next) => {
    const cookies = req.headers.cookie;
    const prevToken = cookies.split("=")[1];
  
    if (!prevToken) {
      return res.status(400).json({ message: "Couldn't find token" });
    }
    jwt.verify(String(prevToken), process.env.JWT_SECRET_KEY, (err, admin) => {
      if (err) {
        console.log(err);
        return res.status(403).json({ message: "Authentication failed" });
      }
      res.clearCookie(`${admin.id}`);
      req.cookies[`${admin.id}`] = "";
      return res.status(200).json({ message: "Successfully Logged Out" });
    });
  };

  //Add new car

  const addCar=async(req,res,next)=>{
    const {carName,brand,segment}=req.body;
    const imageFile=req.file;
    const fileStream = fs.createReadStream(imageFile.path);
    const s3Params = {
    Bucket: bucketName,
    Key: imageFile.originalname,
    Body: fileStream,
    ContentType: imageFile.mimetype,
    };

    let anyCars;

    try{
      anyCars=await Cars.findOne({name:carName})
    }catch(err){
      console.log(err);
    }

    if(anyCars){
      return res.status(400).json({message:"This Car Already Exist!!"})
    }

    const command = new PutObjectCommand(s3Params);
    try {
      await s3.send(command);
    } catch (error) {
      console.log(error);
      return { error };
    }

    const imageUrl = `https://${bucketName}.s3.amazonaws.com/${imageFile.originalname}`;
  

    const newCar=new Cars({
      name:carName,
      brand:brand,
      segment:segment,
      image:imageUrl,
      status:"available"
    });

    try{
      await newCar.save();
    }catch(err){
      console.log(err);
    }

    return res.status(201).json({message:newCar})
  };

  //Get the datails of all the cars added
  
  const getCars=async(req,res,next)=>{
    let cars;
    try{
      cars=await Cars.find();
    }catch(err){
      console.log(err);
    }
    if(cars){
      return res.status(200).json({cars});
    }else{
      return res.status(400).json({message:"No data found in Cars"})
    }
  };

  //Get the details of the car

  const getDetails=async(req,res,next)=>{
    const id=req.params.id;
    console.log(id)
    let car;
    try{
     car=await Cars.findOne({_id:id})
     console.log(car,'selected car')
    }catch(err){
      console.log(err);
    }

    if(car){
      return res.status(200).json({message:car})
    }
    return res.status(400).json({message:"Car did not exist!!"})
  };

  //Edit the details of the car

  const editDetails=async(req,res,next)=>{
    const {id,carName}=req.body;
    const imageFile=req.file;
    const fileStream = fs.createReadStream(imageFile.path);
    const s3Params = {
    Bucket: bucketName,
    Key: imageFile.originalname,
    Body: fileStream,
    ContentType: imageFile.mimetype,
    };

    let anyCar;
    let updatedCar;
    try{
      anyCar=await Cars.findOne({_id:id});
    }catch(err){
      console.log(err)
    }

    if(anyCar){
      const command = new PutObjectCommand(s3Params);
      try {
        await s3.send(command);
      } catch (error) {
        console.log(error);
        return { error };
      }
  
      const imageUrl = `https://${bucketName}.s3.amazonaws.com/${imageFile.originalname}`;
      
  
     updatedCar= await Cars.updateOne({_id:id},{$set:{
        name:carName,
        image:imageUrl
      }});

      return res.status(200).json({updatedCar})
    }
  };

 // Delete the car details

 const deleteCar=async(req,res,next)=>{
  const id=req.params.id;
  let anyCar;
  try{
    anyCar=await Cars.findOne({_id:id})
  }catch(err){
    console.log(err);
  }
  if(anyCar){
    await Cars.deleteOne({_id:id});
    return res.status(200).json({message:"Deleted Car Successfully"})
  }
  return res.status(400).json({message:"No Data Found"})
 };



exports.login = login;
exports.verifyToken = verifyToken;
exports.getAdmin = getAdmin;
exports.refreshToken = refreshToken;
exports.logout = logout;
exports.addCar=addCar;
exports.getCars=getCars;
exports.getDetails=getDetails;
exports.editDetails=editDetails;
exports.deleteCar=deleteCar;
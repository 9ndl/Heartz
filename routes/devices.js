const express = require('express');
let router = express.Router();
let jwt = require("jwt-simple");
let fs = require('fs');
let superagent = require('superagent');
let Device = require("../models/device");
let Reading = require('../models/reading');

// On Repl.it, add JWT_SECRET to the .env file, and use this code
// let secret = process.env.JWT_SECRET

// On AWS ec2, you can use to store the secret in a separate file. 
// The file should be stored outside of your code directory. 
let secret = fs.readFileSync(__dirname + '/../jwtkey').toString();
//let secret = "secret";
let particleAccessToken = fs.readFileSync(__dirname + '/../particle_access_token').toString();
//let particleAccessToken = "89d62e2d1b3d434027bdfe6508ea1bfd8eff5c12";

// Function to generate a random apikey consisting of 32 characters
function getNewApikey() {
  let newApikey = "";
  let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
  for (let i = 0; i < 32; i++) {
    newApikey += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }

  return newApikey;
}

router.post('/register', function(req, res, next) {
  let responseJson = {
    registered: false,
    message : "",
    apikey : "none",
    deviceId : "none"
  };
  let deviceExists = false;
  
  // Ensure the request includes the deviceId parameter
  if( !req.body.hasOwnProperty("deviceId")) {
    responseJson.message = "Missing deviceId.";
    return res.status(400).json(responseJson);
  }

  let email = "";
    
  // If authToken provided, use email in authToken 
  if (req.headers["x-auth"]) {
    try {
      let decodedToken = jwt.decode(req.headers["x-auth"], secret);
      email = decodedToken.email;
    }
    catch (ex) {
      responseJson.message = "Invalid authorization token.";
      return res.status(400).json(responseJson);
    }
  }
  else {
    // Ensure the request includes the email parameter
    if( !req.body.hasOwnProperty("email")) {
      responseJson.message = "Invalid authorization token or missing email address.";
      return res.status(400).json(responseJson);
    }
    email = req.body.email;
  }
    
  // See if device is already registered
  Device.findOne({ deviceId: req.body.deviceId }, function(err, device) {
    if (device !== null) {
      responseJson.message = "Device ID " + req.body.deviceId + " already registered.";
      return res.status(400).json(responseJson);
    }
    else {
      //Get a new apikey
	   deviceApikey = getNewApikey();
      //let fakeBPMReadings = ["000BPM","100BPM","200BPM"];
      //let fakeOXReadings = ["999%","999%","999%"];
      //console.log(fakeBPMReadings[0] + "fake BPM reading");
	    // Create a new device with specified id, user email, and randomly generated apikey.
      let newDevice = new Device({
        deviceId: req.body.deviceId,
        userEmail: email,
        //BPMreadings: ["000BPM","100BPM","200BPM"],
        //O2readings:  ["799%","899%","999%"],
        apikey: deviceApikey
      });

      // Save device. If successful, return success. If not, return error message.
      newDevice.save(function(err, newDevice) {
        if (err) {
          responseJson.message = err;
          return res.status(400).json(responseJson);
        }
        else {
          responseJson.registered = true;
          responseJson.apikey = deviceApikey;
          responseJson.deviceId = req.body.deviceId;
          responseJson.message = "Device ID " + req.body.deviceId + " was registered.";
          return res.status(201).json(responseJson);
        }
      });
    }
  });
});
//route for the publishing the readings from the device
router.post('/report', function(req, res, next){
  let responseJson = {
    registered: false,
    message : "",
    apikey : "none",
    deviceId : "none"
  };  
  let newReading = new Reading();
  // Ensure the request includes the deviceId parameter
  if( !req.body.hasOwnProperty("deviceId")) {
    responseJson.message = "Missing deviceId.";
    return res.status(401).json(responseJson);
  }
  //Check if there is apikey
  if( !req.body.hasOwnProperty("apikey")) {
    responseJson.message = "Missing apikey.";
    return res.status(401).json(responseJson);
  }
  //check if there is readings to register 
  if( !req.body.hasOwnProperty("avgBPM")) {
    responseJson.message = "Missing avgBPM.";
    return res.status(401).json(responseJson);
  }
  if( !req.body.hasOwnProperty("avgO2")) {
    responseJson.message = "Missing avgO2.";
    return res.status(401).json(responseJson);
  }


  Device.findOne({ deviceId: req.body.deviceId}, function(err, device){
    if(err){//error contacting the data base
      res.status(401).json({ success: false, message: "Can't connect to DB." });
    }//when the device id doesnt exists in the data base
    else if(!device){
      res.status(401).json({ success: false, message: "Device with this ID is not registered in the data base" });
    }//the device exists and found
    else if(device.apikey != req.body.apikey){
      res.status(401).json({ success: false, message: "apikey is wrong!" });
    }else {
      newReading.deviceId = device.deviceId;
      newReading.userEmail = device.userEmail;
      newReading.BPMreading = req.body.avgBPM;
      newReading.O2reading = req.body.avgO2;
      newReading.timestamp = new Date(req.body.timestamp);
      newReading.epochTime = Math.floor(newReading.timestamp.getTime()/1000.0);
      newReading.save(function (err, savedReading){
        if(err){
          res.status(401).json({ success: false, message: "Failed to save to data base"});
        }else{
          res.status(201).json({ success: true, message: "updated to the data base ("+savedReading.timestamp+" & "+savedReading.BPMreading+" & "
          +savedReading.O2reading + " &" + newReading.deviceId + newReading.userEmail+")"});
        }
        //console.log("New GPA: " + stu.gpa);
      });
      //Device.update({deviceId: req.body.deviceId}, { birthDate: new Date(1995, 11, 2) })
     /*
      let options ={//dont creat new document if no document match
        upsert: false
      }
      Device.replaceOne({deviceId: req.body.deviceId}, device, options);*/
      //res.status(201).json({ success: true, message: "Server received the readings ("+req.body.avgBPM+")."});
    }

  });

});

router.post('/deregister', function(req, res, next){
  let responseJson = {
    registered: false,
    message : "",
    apikey : "none",
    deviceId : "none"
  };

  if( !req.body.hasOwnProperty("deviceId")) {
    responseJson.message = "Missing deviceId.";
    return res.status(401).json(responseJson);
  }
  try {
    
  } catch (err) {
    
  }
  //remove the device.
  Device.findOneAndRemove({ deviceId: req.body.deviceId}, function(err, device){
    if(err){//error contacting the data base
      res.status(401).json({ success: false, message: "Can't connect to DB." });
    }//when the device id doesnt exists in the data base
    else if(!device){
      res.status(401).json({ success: false, message: "Device with this ID is not registered in the data base" });
    }//the device exists and found
    else{
      res.status(201).json({ success: true, message: "Device " + req.body.deviceId + " deregistered"});
    }
  });
});

router.post('/info', async function(req, res, next){
  var responseJson = {
    success: false,
    deviceId: req.body.deviceId,
    apiKey: "",
    reminderInterval: 0,
    reminderStartHour: 0,
    reminderStartMinute: 0,
    reminderEndHour: 0,
    reminderEndMinute: 0,
    message : ""
  };

  let deviceExists = false;
  if( !req.body.hasOwnProperty("deviceId")) {
    responseJson.message = "Missing deviceId.";
    return res.status(400).json(responseJson);
  }
  try {
    let decodedToken = jwt.decode(req.headers["x-auth"], secret);
  }
  catch (ex) {
    responseJson.message = "Invalid authorization token.";
    return res.status(400).json(responseJson);
  }

  Device.findOne({deviceId: req.body.deviceId}, function(err, device){
    if(err){//error contacting the data base
      res.status(401).json({ success: false, message: "Can't connect to DB." });
    }//when the device id doesnt exists in the data base
    else if(!device){
      res.status(401).json({ success: false, message: "Device with this ID is not registered in the data base" });
    }//the device exists and found
    else{
      responseJson.apiKey = device.apikey;
    }
  });

  let temp = await superagent
    .get("https://api.particle.io/v1/devices/" + req.body.deviceId + "/reminderInterval")
    .query({access_token: particleAccessToken})
    .then(result => {
      responseJson.reminderInterval = result.body.result;
    })
    .catch(error =>{
      responseJson.message = error.message;
    });
  if (responseJson.message != ""){
    return res.status(400).json(responseJson);
  }
  temp = await superagent
    .get("https://api.particle.io/v1/devices/" + req.body.deviceId + "/reminderPeriod")
    .query({access_token: particleAccessToken})
    .then(function(result){
      responseJson.success = true;
      let splitString = result.body.result.split('-');
      let start = splitString[0].split(':');
      let end = splitString[1].split(':');
      responseJson.reminderStartHour = start[0];
      responseJson.reminderStartMinute = start[1];
      responseJson.reminderEndHour = end[0];
      responseJson.reminderEndMinute = end[1];
      let reminderPeriodJson = {
        reminderStartHour: start[0],
        reminderStartMinute: start[1],
        reminderEndHour: end[0],
        reminderEndMinute: end[1]
      }
      return reminderPeriodJson;
    })
    .catch(error => {
      responseJson.message = error.message;
    });
  console.log(temp);
  if (responseJson.message != ""){
    return res.status(400).json(responseJson);
  }
  console.log(responseJson);
  return res.status(200).json(responseJson);
});

router.post('/setReminderPeriod', async function(req, res, next){
  let responseJson = {
    success: false,
    message: ""
  };
  console.log(req.body);
  if(!req.body.hasOwnProperty("deviceId")) {
    responseJson.message = "Missing deviceId.";
    return res.status(400).json(responseJson);
  }
  if(!req.body.hasOwnProperty("startPeriod")) {
    responseJson.message = "Missing start period.";
    return res.status(400).json(responseJson);
  }
  if(!req.body.hasOwnProperty("endPeriod")) {
    responseJson.message = "Missing end period.";
    return res.status(400).json(responseJson);
  }
  try {
    let decodedToken = jwt.decode(req.headers["x-auth"], secret);
  }
  catch (ex) {
    responseJson.message = "Invalid authorization token.";
    return res.status(400).json(responseJson);
  }
  let startTime = req.body.startPeriod.split(' ');
  let endTime = req.body.endPeriod.split(' ');
  let timePeriod = "";
  let start = startTime[0].split(':');
  let end = endTime[0].split(':');
  let startHour = 0;
  let endHour = 0;
  let startMinute = parseInt(start[1]);
  let endMinute = parseInt(end[1]);
  if (startTime[1] === "PM"){
    startHour = ((parseInt(start[0]) % 12) + 12);
    //timePeriod = ((parseInt(start[0]) % 12) + 12) + ":" + start[1];
  }
  else{
    startHour = (parseInt(start[0]) % 12);
    //timePeriod = (parseInt(start[0]) % 12) + ":" + start[1];
  }
  timePeriod = startHour + ":" + startMinute + "-";
  if (endTime[1] === "PM"){
    endHour = ((parseInt(end[0]) % 12) + 12);
    //timePeriod = timePeriod + ((parseInt(end[0]) % 12) + 12) + ":" + end[1];
  }
  else{
    endHour = (parseInt(end[0]) % 12)
    //timePeriod = timePeriod + (parseInt(end[0]) % 12) + ":" + end[1];
  }
  timePeriod = timePeriod + endHour + ":" + endMinute;

  if (startHour > endHour){
    responseJson.message = "Start period begins after end period.";
    return res.status(400).json(responseJson);
  }
  else if (startHour === endHour){
    if (startMinute > endMinute){
      responseJson.message = "Start period begins after end period.";
      return res.status(400).json(responseJson);
    }
  }

  let temp = await superagent
    .post("https://api.particle.io/v1/devices/" + req.body.deviceId + "/setReminderPeriod")
    .type("form")
    .send({ access_token: particleAccessToken })
    .send({ args: timePeriod })
    .then((res) => {
      responseJson.message = "received";
      responseJson.success = true;
    })
    .catch((err) => {
      responseJson.message = err.message;
      responseJson.success = false;
    });
    if (responseJson.success === false){
      return res.status(400).json(responseJson);
    }
    return res.status(200).json(responseJson);
});

router.post('/setReminderInterval', async function(req, res, next){
  let responseJson = {
    success: false,
    message: ""
  };
  if(!req.body.hasOwnProperty("deviceId")) {
    responseJson.message = "Missing deviceId.";
    return res.status(400).json(responseJson);
  }
  try {
    let decodedToken = jwt.decode(req.headers["x-auth"], secret);
  }
  catch (ex) {
    responseJson.message = "Invalid authorization token.";
    return res.status(400).json(responseJson);
  }
  let timeInterval = req.body.reminderInterval;

  let temp = await superagent
    .post("https://api.particle.io/v1/devices/" + req.body.deviceId + "/setReminderInterval")
    .type("form")
    .send({ access_token: particleAccessToken })
    .send({ args: timeInterval })
    .then((res) => {
      responseJson.message = "received";
      responseJson.success = true;
    })
    .catch((err) => {
      responseJson.message = err.message;
      responseJson.success = false;
    });
    if (responseJson.success === false){
      return res.status(400).json(responseJson);
    }
    return res.status(200).json(responseJson);
});
/*
router.post('/ping', function(req, res, next) {
    let responseJson = {
        success: false,
        message : "",
    };
    let deviceExists = false;
    
    // Ensure the request includes the deviceId parameter
    if( !req.body.hasOwnProperty("deviceId")) {
        responseJson.message = "Missing deviceId.";
        return res.status(400).json(responseJson);
    }
    
    // If authToken provided, use email in authToken 
    try {
        let decodedToken = jwt.decode(req.headers["x-auth"], secret);
    }
    catch (ex) {
        responseJson.message = "Invalid authorization token.";
        return res.status(400).json(responseJson);
    }
    
    // Start the signaling. Rainbows!!
    superagent
      .put("https://api.particle.io/v1/devices/" + req.body.deviceId)
      .type('application/x-www-form-urlencoded')
      .send({ signal: 1, access_token : particleAccessToken }) 
      .end((err, response) => {
      
        // Stop the signaling. 
        superagent
        .put("https://api.particle.io/v1/devices/" + req.body.deviceId)
        .type('application/x-www-form-urlencoded')
        .send({ signal: 0, access_token : particleAccessToken }) 
        .end((err, response) => {});    
      
        responseJson.success = true;
        responseJson.message = "Device ID " + req.body.deviceId + " pinged.";
        return res.status(200).json(responseJson);
      });    
});*/

module.exports = router;

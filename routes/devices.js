const express = require('express');
let router = express.Router();
let jwt = require("jwt-simple");
let fs = require('fs');
let superagent = require('superagent');
let Device = require("../models/device");

// On Repl.it, add JWT_SECRET to the .env file, and use this code
// let secret = process.env.JWT_SECRET

// On AWS ec2, you can use to store the secret in a separate file. 
// The file should be stored outside of your code directory. 
//let secret = fs.readFileSync(__dirname + '/../../jwtkey').toString();
let secret = "secret";
//let particleAccessToken = fs.readFileSync(__dirname + '/../../particle_access_token').toString();

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
      /*let fakeBPMReadings = [];
      let fakeOXReadings = [];
      fakeBPMReadings.push("000BPM");
      fakeOXReadings.push("999%");*/
	    // Create a new device with specified id, user email, and randomly generated apikey.
      let newDevice = new Device({
        deviceId: req.body.deviceId,
        userEmail: email,
        BPMreadings: ["000BPM","000BPM","000BPM"],
        O2readings:  ["999%","999%","999%"],
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
      device.BPMreadings.push(req.body.avgBPM);
      let options ={//dont creat new document if no document match
        upsert: no
      }
      Device.replaceOne({deviceId: req.body.deviceId}, device, options);
      res.status(201).json({ success: true, message: "Server received the readings ("+req.body.avgBPM+")."});
    }

  });

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

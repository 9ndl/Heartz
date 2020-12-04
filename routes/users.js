//users routes
const express = require('express');
let router = express.Router();
let bcrypt = require("bcryptjs");
let jwt = require("jwt-simple");
let fs = require('fs');
let User = require('../models/user');
let Device = require('../models/device');
let Reading = require('../models/reading');
// On Repl.it, add JWT_SECRET to the .env file, and use this code
// let secret = process.env.JWT_SECRET

// On AWS ec2, you can use to store the secret in a separate file. 
// The file should be stored outside of your code directory. 
//for the secret
//let secret = fs.readFileSync(__dirname + '/../../jwtkey').toString();
let secret = "secret";

//register a new user
router.post('/register', function(req, res) {
    //hash the password
    bcrypt.hash(req.body.password, 10, function(err, hash) {
        if (err) {
          res.status(400).json({success : false, message : err.errmsg});  
        }
        else {
            //creat user
          let newUser = new User({
            email: req.body.email,
            fullName: req.body.fullName,
            passwordHash: hash
          });
        //safe the user info in the database
          newUser.save(function(err, user) {
            if (err) {
              res.status(400).json({success: false,
                                    message: err.errmsg});
            }
            else {
              res.status(201).json({success: true,
                                    message: user.fullName + " has been created."});
            }
          });
        }
      });
});

// Authenticate a user
router.post('/signin', function(req, res) {
    User.findOne({email: req.body.email}, function(err, user) {
      if (err) {
        res.status(401).json({ success: false, message: "Can't connect to DB." });
      }
      //case user dont exists
      else if (!user) {
          //send message with error code
        res.status(401).json({ success: false, message: "Email or password invalid." });
      }
      else {
          //if user exists, compare the passwordhash with passowrd entered
        bcrypt.compare(req.body.password, user.passwordHash, function(err, valid) {
          if (err) {//case if the comparison dont work
            res.status(401).json({ success: false, message: "Error authenticating. Contact support." });
          }//if passowrd == encoded hashed
          else if(valid) {
            //create the authentication token
            let authToken = jwt.encode({email: req.body.email}, secret);
            res.status(201).json({ success: true, authToken: authToken });
          }
          else {
            res.status(401).json({ success: false, message: "Email or password invalid." });
          }
        });
      }
    });
  });

  // Access and Return account information
router.get('/account', function(req, res) {
    // check if authtoken exists
    if (!req.headers["x-auth"]) {
      res.status(401).json({ success: false, message: "No authentication token."});
      return;
    }
    //get the authtoken
    let authToken = req.headers["x-auth"];
    //creat the info object
    let accountInfo = { };
  
    try {
        // Toaken decoded
        let decodedToken = jwt.decode(authToken, secret);
        //find the decoded email in the db
        User.findOne({email: decodedToken.email}, function(err, user) {
            if (err) {
                res.status(400).json({ success: false, message: "Error contacting DB. Please contact support."});
            }
            else {
                //if found add info to the object 
                accountInfo["success"] = true;
                accountInfo["email"] = user.email;
                accountInfo["fullName"] = user.fullName;
                accountInfo["lastAccess"] = user.lastAccess;
                accountInfo["devices"] = [];// Array of devices
                accountInfo["Readings"]= [Reading];
                accountInfo["OXResults"] = [];
                accountInfo["timestamps"] = [];
                //send info back
                //res.status(200).json(accountInfo);
                Reading.find({userEmail: decodedToken.email}, function(err, allReadings){
                  if(!err){
                    //console.log(allReadings[0].userEmail);
                    accountInfo.Readings = allReadings;
                    //console.log(accountInfo.Readings[0].userEmail);
                  }
                });
           // Find devices based on decoded token
           Device.find({ userEmail : decodedToken.email}, function(err, devices) {
              if (!err) {
                for (device of devices) {
                  accountInfo['devices'].push({ deviceId: device.deviceId, apikey: device.apikey });
                  /*for(BPMread of device.BPMreadings){
                    accountInfo["BPMResults"].push(BPMread);
                    console.log(BPMread);
                    console.log("bmread loop");
                  }
                  for(OXread of device.O2readings){
                    accountInfo["OXResults"].push(OXread);
                    console.log(OXread);
                    console.log("OXread loop");
                  }*/
                  //accountInfo["BPMResults"] = accountInfo["BPMResults"].concat(device.BPMreadings);
                  //accountInfo["OXResults"] = accountInfo["OXResults"].concat(device.O2readings);
                  //accountInfo["timestamps"] = accountInfo["timestamps"].concat(device.timestamps);
                  //console.log(device.BPMreadings[0]+"BPMreading sarray exists");
                  //console.log(device.O2readings[0]+"O2readings array exists");
                }
             }
             //console.log(accountInfo["BPMResults"][0]+"before sending the response");
             res.status(200).json(accountInfo);
           });
         }
       });
    }
    catch (ex) {
      // Token was invalid
      res.status(401).json({ success: false, message: "Invalid authentication token."});
    }
  });

module.exports = router;
//users routes
const express = require('express');
let router = express.Router();
let bcrypt = require("bcryptjs");
let jwt = require("jwt-simple");
let fs = require('fs');
let User = require('../models/user');
let Device = require('../models/device');
// On Repl.it, add JWT_SECRET to the .env file, and use this code
// let secret = process.env.JWT_SECRET

// On AWS ec2, you can use to store the secret in a separate file. 
// The file should be stored outside of your code directory. 
//for the secret
//let secret = fs.readFileSync(__dirname + '/../../jwtkey').toString();
let secret = "secret";
//register a new user
router.post('/register', function(req, res) {
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

module.exports = router;
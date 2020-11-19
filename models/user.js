//user schema
let db = require("../db");
let Device = require("./device");

let userSchema = new db.Schema({
  email:        { type: String, required: true, unique: true },
  fullName:     { type: String, required: true },
  passwordHash: String,
  lastAccess:   { type: Date, default: Date.now },
  userDevices:  [ String ]
});

let User = db.model("User", userSchema);

module.exports = User;
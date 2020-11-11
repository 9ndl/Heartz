
let db = require("../db");

let deviceSchema = new db.Schema({
    apikey:       String,
    deviceId:     String,
    userEmail:    String,
    lastContact:  { type: Date, default: Date.now }
});

let Device = db.model("Device", deviceSchema);

module.exports = Device;
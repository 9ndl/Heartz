
let db = require("../db");

let deviceSchema = new db.Schema({
    apikey:       String,
    deviceId:     String,
    userEmail:    String,
    lastContact:  { type: Date, default: Date.now },
    BPMreadings: [String],
    O2readings: [String],
    timeStamps: [Date]
});

let Device = db.model("Device", deviceSchema);

module.exports = Device;

let db = require("../db");
//fixed the unique values for apikey and deviceId
let deviceSchema = new db.Schema({
    apikey:       { type: String, unique: true },
    deviceId:     { type: String, unique: true },
    userEmail:    String,
    lastContact:  { type: Date, default: Date.now },
    BPMreadings: [String],
    O2readings: [String],
    timestamps: [Date]
});

let Device = db.model("Device", deviceSchema);

module.exports = Device;
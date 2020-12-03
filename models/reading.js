let db = require("../db");

let readingSchema = new db.Schema({
    deviceId:     String,
    userEmail:    String,
    BPMreading:   String,
    O2reading:    String,
    timestamp:    Date
});

let Reading = db.model("Reading", readingSchema);

module.exports = Reading;
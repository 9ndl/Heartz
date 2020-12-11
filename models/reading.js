let db = require("../db");

let readingSchema = new db.Schema({
    deviceId:     String,
    userEmail:    String,
    BPMreading:   Number,
    O2reading:    Number,
    epochTime:    Number,
    timestamp:    Date
});

let Reading = db.model("Reading", readingSchema);

module.exports = Reading;
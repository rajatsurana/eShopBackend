var apn = require('apn');
var options = { passphrase:"esubzi"};
options["cert"] = "./apns/cert.pem";
options["key"] = "./apns/key.pem";
var apnConnection = new apn.Connection(options);
var myDevice = new apn.Device("e4e6076f2eb0bb9d4529afcb06fedfd86034ecc24044159581f327a331041729");

function sendPushes(message)
{
    var note = new apn.Notification();

    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.badge = 3;
    note.sound = "ping.aiff";
    note.alert = message;
    note.payload = {'messageFrom': 'Caroline'};

    apnConnection.pushNotification(note, myDevice);
}

module.exports.sendPushes = sendPushes

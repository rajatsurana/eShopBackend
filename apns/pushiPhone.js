var apn = require('apn');
var options = { passphrase:"eSubzi"};
options["cert"] = "./apns/cert.pem";
options["key"] = "./apns/key.pem";
var apnConnection = new apn.Connection(options);
var myDevice = new apn.Device("a92cab8a4d62dd5f5371b49647810ac3766bb196ff2b2a0ca0a85be3b8f26e10");

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

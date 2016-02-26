var mongoose = require('mongoose')

var Schema = mongoose.Schema;

var userSchema =new Schema({
    name: String,
    password: String,
    admin: Boolean
})
var User = mongoose.model('User', userSchema);
module.exports = User;

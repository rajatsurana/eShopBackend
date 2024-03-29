var mongoose = require('mongoose')

var Schema = mongoose.Schema;

var weddingSchema = new Schema
({
    name: String,
    email: String,
    guest: String,
    attending: String,
    arrivedate: String,
    arrivetime: String,
    departdate: String,
    departtime: String,
    transport: String
});

weddingSchema.pre('save', function(next)
{
    var currentDate = new Date();
    this.updated_at = currentDate;
    if (!this.created_at)
    this.created_at = currentDate;
    next();
});

var Wedding = mongoose.model('Wedding', weddingSchema);
module.exports.Wedding = Wedding;
module.exports.weddingSchema = weddingSchema

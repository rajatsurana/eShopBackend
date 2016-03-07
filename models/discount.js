var mongoose = require('mongoose')

var Schema = mongoose.Schema;

var discountSchema = new Schema
({
    shopKeeperId: String,
    discountDescription: String,
    created_at: Date,
    updated_at: Date
});

discountSchema.pre('save', function(next)
{
    var currentDate = new Date();
    this.updated_at = currentDate;
    if (!this.created_at)
    this.created_at = currentDate;
    next();
});

var Discount = mongoose.model('Discount', discountSchema);
module.exports = Discount;

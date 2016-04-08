var mongoose = require('mongoose')
var productSchema = require('./product').productSchema
var Schema = mongoose.Schema;
var enumObj =
{
  values: 'OrderReceived OrderBeingProcessed Delivering Delivered'.split(' '),
  message: 'enum validator failed for path `{PATH}` with value `{VALUE}`'
}
var orderSchema = new Schema
({
    items :[productSchema],
    shopKeeperId:String ,
    customerId:String,
    currentState: { type: String, enum: enumObj },
    totalAmount: Number,
    created_at: Date,
    updated_at: Date
});

orderSchema.pre('save', function(next)
{
  var currentDate = new Date();
  this.updated_at = currentDate;
  if (!this.created_at)
    this.created_at = currentDate;
  next();
});

var Order = mongoose.model('Order', orderSchema);
module.exports = Order;

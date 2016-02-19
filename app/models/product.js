
var mongoose = require('mongoose')

var Schema = mongoose.Schema;

// create a schema
var productSchema = new Schema({
	product_id: { type: Number, required: true, unique: true },
	price: Number,
	quantity :Number,
	photoUrl: String,
	description: String,
	discount: Number,
    created_at: Date,
    updated_at: Date
});

var Product = mongoose.model('Product', productSchema);


// make this available to our users in our Node applications
module.exports = Product;

// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
//var Bear     = require('./app/models/bear');
var Product = require('./app/models/product');
// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var mongoose   = require('mongoose');
mongoose.connect('mongodb://localhost/eSubziDatabase3');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
});
var port = process.env.PORT || 8080;        // set our port
// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    console.log('Something is happening.');
    next(); // make sure we go to the next routes and don't stop here
});
// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });   
});

// more routes for our API will happen here
	router.route('/list_products')
		.get(function(req, res) {
			Product.find(function(err, products) {
				if (err)
					res.send(err);

				res.json(products);
			});
		});
		// http://localhost:8080/api/create_product?productId=2&new_price=350&quantity=12&description=Tamatar
		router.route('/create_product')
		.get(function(req, res) {
			var product = new Product();      // create a new instance of the Bear model
			product.price = req.query['new_price'] || 'default';  // set the bears name (comes from the request)
			product.product_id=req.query['productId'] || 'default';
			product.quantity = req.query['quantity'] || 'default';
			product.description = req.query['description'] || 'default';
			product.save(function(err) {
				if (err)
					res.send(err);

				res.json({ message: 'product created!' });
			});
		});
	router.route('/create_product/:productId/:new_price/:quantity/:description')
		.post(function(req, res) {
			//console.log(req.body.name);
			//console.log('post call');
			var product = new Product();      // create a new instance of the Bear model
			product.price = req.params.new_price;  // set the bears name (comes from the request)
			product.product_id=req.params.productId;
			product.quantity = req.params.quantity;
			product.description = req.params.description;
			// save the bear and check for errors
			product.save(function(err) {
				if (err)
					res.send(err);

				res.json({ message: 'product created!' });
			});
			
		});
		router.route('/update_price/:productId/:new_price')
		
		.put(function(req, res) {
			Product.find({ product_id: req.params.productId }, function(err, product) {
				product.price=req.params.new_price;
				product.save(function(err) {
					if (err)
						res.send(err);

					res.json({ message: 'Product price updated!' });
				});
				
			});
		});

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
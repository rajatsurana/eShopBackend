var express    = require('express');
var bodyParser = require('body-parser');
var app        = express();
var morgan     = require('morgan');
var Product = require('./models/product');
var mongoose   = require('mongoose');
var router = express.Router();
var pushiPhone = require('./apns/pushiPhone')
var pushAndroid = require('./androidPush/androidPNS')
var async = require('async')
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost/eSubzi');


router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });
});

router.route('/products')
.get(function(req, res)
{
    Product.find(function(err, products)
    {
        if (err)
        {
            res.send(err)
        }
        res.json(products);
    });
})
.post(function(req,res)
{
    var product = new Product();

    product.price =  req.body.price || '0',
    product.quantity = req.body.quantity || '0',
    product.description = req.body.description || 'default'
    product.discount = req.body.discount || '0'
    product.save(function(err) {
        if (err)
        {
            res.send(err);
        }
        res.json({ message: 'product created!', newProduct: product});
    });
})
router.route('/update_price')
.post(function(req, res)
{

    if (req.body["price"] == 0)
    {
        res.send({message : "price can't be 0"})
    }
    else
    {
        Product.findOne({ _id: req.body.id }, function(err, product)
        {

            product.price = req.body.price;

            product.save(function(err) {
                if (err)
                {
                    res.send(err);
                }
                res.json({ message: 'Product price updated!' ,newProduct:product});
            });

        });
    }

});
router.route('/change_discount')
.post(function(req, res)
{
    Product.findOne({ _id: req.body.id }, function(err, product)
    {
        product.discount=req.body.discount || '0';
        product.save(function(err) {
            if (err)
            {
                res.send(err);
            }
            async.series([
                async.asyncify(pushiPhone.sendPushes("Discount changed to " + product.discount)),
                function () {
                    // data is the result of parsing the text.
                    // If there was a parsing error, it would have been caught.
                },
				async.asyncify(pushAndroid.sendPushes("Discount changed to " + product.discount)),
                function () {
                    // data is the result of parsing the text.
                    // If there was a parsing error, it would have been caught.
                }
            ]);

            res.json({ message: 'Discount value changed!' ,newProduct : product});

        });

    });
});

app.use('/api', router);
app.listen(3000);
console.log('Magic happens on port 3000');

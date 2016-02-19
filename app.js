var express    = require('express');
var bodyParser = require('body-parser');
var app        = express();
var morgan     = require('morgan');
var Product = require('./models/product');
var mongoose   = require('mongoose');
var router = express.Router();

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
            product.quantity = req.body.price || '0',
            product.description = req.body.description || 'default'

        product.save(function(err) {
            if (err)
            res.send(err);

            res.json({ message: 'product created!', newProduct: product});
        });
    })
router.route('/update_price/:productId')
.get(function(req, res) {
    Product.findOne({ product_id: req.params.productId }, function(err, product) {
        product.price=req.query['new_price'] || 'default';
        product.save(function(err) {
            if (err)
            res.send(err);

            res.json({ message: 'Product price updated!' });
        });

    });
});

app.use('/api', router);
app.listen(3000);
console.log('Magic happens on port 3000');

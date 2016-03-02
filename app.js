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
var jwt    = require('jsonwebtoken');
var config = require('./models/config');
var User   = require('./models/user');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan('tiny'))

mongoose.connect('mongodb://localhost/eSubzi');

app.set('superSecret', config.secret);

router.get('/', function(req, res)
{
    res.json({ message: 'hooray! welcome to our api!' });
});

router.route('/setup')
.get(function(req, res) {
    var user = new User({
        name: 'Rajat Surana',
        password: 'password',
        admin: true
    });

    user.save(function(err) {
        if (err) throw err;
        console.log('User saved successfully');
        res.json({ success: true ,user:user});
    });
});

router.get('/users', function(req, res)
{
    User.find({}, function(err, users) {
        res.json(users);
    });
});

router.post('/authenticate', function(req, res)
{
    User.findOne(
        {
            name: req.body.name
        },
        function(err, user)
        {
            if (err) throw err;
            if (!user)
            {
                res.json({ success: false, message: 'Authentication failed. User not found.' });
            }
            else if (user)
            {
                if (user.password != req.body.password)
                {
                    res.json({ success: false, message: 'Authentication failed. Wrong password.' });
                }
                else
                {
                    var token = jwt.sign(user, app.get('superSecret'),
                    {
                        expiresInMinutes: 1440
                    });
                    res.json({
                        success: true,
                        message: 'Enjoy your token!',
                        token: token
                    });
                }
            }
        });
});

router.use(function(req, res, next)
{
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    if (token)
    {
        jwt.verify(token, app.get('superSecret'), function(err, decoded) {
            if (err) {
                return res.json({ success: false, message: 'Failed to authenticate token.' });
            } else {
                req.decoded = decoded;
                next();
            }
        });
    }
    else
    {
        return res.status(403).send(
        {
            success: false,
            message: 'No token provided.'
        });
    }
});

//token required before fetching products or other apis below
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
    product.description = req.body.description || 'default',
    product.discount = req.body.discount || '0'
    product.save(function(err)
    {
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
            product.save(function(err)
            {
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
        product.save(function(err)
        {
            if (err)
            {
                res.send(err);
            }
            async.series([
                async.asyncify(pushiPhone.sendPushes("Discount changed to " + product.discount)),
				async.asyncify(pushAndroid.sendPushes("Discount changed to " + product.discount))
            ]);
            res.json({ message: 'Discount value changed!' ,newProduct : product});
        });
    });
});

app.use('/api', router);
app.listen(3000);
console.log('Magic happens on port 3000');

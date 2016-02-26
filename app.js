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
var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./models/config'); // get our config file
var User   = require('./models/user'); // get our mongoose model
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost/eSubzi');
app.set('superSecret', config.secret);

router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });
});
router.route('/setup')
.get(function(req, res) {
  // create a sample user
  var nick = new User({
    name: 'Rajat Surana',
    password: 'password',
    admin: true
  });
  // save the sample user
  nick.save(function(err) {
    if (err) throw err;

    console.log('User saved successfully');
    res.json({ success: true ,user:nick});
  });
});
router.get('/users', function(req, res) {
  User.find({}, function(err, users) {
    res.json(users);
  });
});
router.post('/authenticate', function(req, res) {

  // find the user
  User.findOne({
    name: req.body.name
  }, function(err, user) {

    if (err) throw err;

    if (!user) {
      res.json({ success: false, message: 'Authentication failed. User not found.' });
    } else if (user) {

      // check if password matches
      if (user.password != req.body.password) {
        res.json({ success: false, message: 'Authentication failed. Wrong password.' });
      } else {

        // if user is found and password is right
        // create a token
        var token = jwt.sign(user, app.get('superSecret'), {
          expiresInMinutes: 1440 // expires in 24 hours
        });

        // return the information including token as JSON
        res.json({
          success: true,
          message: 'Enjoy your token!',
          token: token
        });
      }

    }

  });
});
//check token is present or not--middleware
router.use(function(req, res, next) {

  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  // decode token
  if (token) {

    // verifies secret and checks exp
    jwt.verify(token, app.get('superSecret'), function(err, decoded) {
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;
        next();
      }
    });

  } else {

    // if there is no token
    // return an error
    return res.status(403).send({
        success: false,
        message: 'No token provided.'
    });

  }
});

//token required before fetching products or other apis
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

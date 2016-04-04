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
var passport = require('passport')
var config = require('./models/config');
var User   = require('./models/user');
var Order   = require('./models/order');
var Discount = require('./models/discount');
var Device = require('./models/device');
var LocalStrategy   = require('passport-local').Strategy;
var jwt = require('jsonwebtoken');
var multiparty = require('multiparty');
var fs = require('fs');
var format = require('util').format;
var secret = 'superSecret'

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan('tiny'))
app.use(passport.initialize());

mongoose.connect('mongodb://localhost/eSubzi');

app.set('superSecret', config.secret);

passport.use('local-login',new LocalStrategy(
    {
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : false
    },
    function(email, password, done)
    {
        User.findOne({ 'email': email }, function(err, user)
        {
            if (err) { return done(err); }
            if (!user)
            {
                return done(null, false, { message: 'Incorrect username.' });
            }
            if (!user.validPassword(password))
            {
                return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, user);
        });
    }
));

passport.use('local-signup',new LocalStrategy(
    {
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true
    },
    function(req,email,password,done)
    {
        User.findOne({'email':email},function(err,user)
        {
            if(err)
            return done(err)
            if(user)
            {
                return done(null, false, { message: 'email already exists'});
            }
            else
            {
                var newUser = new User()
                newUser.email = email
                newUser.password = newUser.generateHash(password)
                newUser.userType = req.body.userType
                newUser.save(function(err)
                {
                    if(err)
                    throw err
                    return done(null,newUser)
                })
            }
        })

    }
))

router.get('/', function(req, res)
{
    res.json({ message: 'hooray! welcome to our api!' });
});

router.post('/login', function(req, res, next)
{
    passport.authenticate('local-login', function(err, user, info) {
        if (err) { return next(err) }
        if (!user) {
            console.log(info.message);
            return res.status(401).json({ error: info.message });
        }

        var token = jwt.sign(user, app.get('superSecret'), {
            expiresInMinutes: 1440*10 // expires in 24 hours
        });
        res.json({ token : token, userId:user._id, email:user.email, type:user.userType});

    })(req, res, next);
});

router.post('/signup', function(req, res, next)
{
    passport.authenticate('local-signup', function(err, user, info) {
        if (err) { return next(err) }
        var token = jwt.sign(user, app.get('superSecret'), {
            expiresInMinutes: 1440 // expires in 24 hours
        });
        res.json({ token : token, email:user.email, userId:user._id,type:user.userType});

    })(req, res, next);
});


router.use(function(req, res, next)
{
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
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
//var form = new multiparty.Form(options)

//token required before fetching products or other apis below
router.route('/register')
.post(function(req, res){
    var device = new Device();
    device.deviceType=req.body.type;
    device.email=req.body.email;
    device.token=req.body.regId;
    Device.find({token:req.body.regId},function(err, devices)
    {
        if (err)
        {
            res.send(err)
        }
        if(devices.length==0){
            device.save(function(err)
            {
                if (err)
                {
                    res.send(err);
                }
                console.log(device);
                res.json({ message: 'New Device registered', Device: device});
            });
        }else{
            res.json({message:'Already Registered' , Device: device});
        }

    });
});

router.route('/products/find')
.post(function(req, res)
{
    Product.find({userId:req.body.userId},function(err, products)
    {
        if (err)
        {
            res.send(err)
        }
        res.json({products:products});
    });
});

router.route('/products/get')
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


router.route('/products/create')
.post(function(req,res)
{
    var product = new Product();
    product.price =  req.body.price || '0',
    product.quantity = req.body.quantity || '0',
    product.description = req.body.description || 'default',
    product.discount = req.body.discount || '0',
    product.userId=req.body.userId || '0'
    product.save(function(err)
    {
        if (err)
        {
            res.send(err);
        }
        res.json({ message: 'product created!', newProduct: product});
    });
});

router.route('/update_price')
.post(function(req, res)
{
    if (req.body.price == 0)
    {
        res.send({message : "price can't be 0"})
    }
    else
    {
        Product.findOne({ _id: req.body.id }, function(err, product)
        {
            if(!product)
            {
                console.log("not found");
                res.json({ message: 'Not found'});
            }
            else
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
            }
        });
    }
});


router.route('/discounts/get')
.get(function(req,res)
{
    Discount.find(function(err, discounts)
    {
        if (err)
        {
            res.send(err)
        }
        res.json({Discounts:discounts});
    });
})

router.route('/discounts/create')
.post(function(req,res)
{
    var discount = new Discount()
    discount.shopKeeperId = req.body.shopKeeperId
    discount.discountDescription = req.body.discountDescription
    var regArr =[];
    Device.find({},function(err,devices){
    console.log(devices.length);
        for(var y=0;y<devices.length;y++){
            if(devices[y].deviceType=="Android"){
                regArr.push(devices[y].token);
                console.log(devices[y].token);
                console.log(regArr.length+" : length");
            }
        }
    });
    discount.save(function(err)
    {
        if (err)
        {
            res.send(err);
        }

        async.series([
            async.asyncify(pushiPhone.sendPushes(discount.discountDescription)),
            async.asyncify(pushAndroid.sendPushes(discount.discountDescription,regArr))
        ]);
        res.json({ message: 'discount added!', newDiscount: discount});
    });
})

router.route('/changeDiscount')
.post(function(req, res)
{
    Product.findOne({ _id: req.body.id }, function(err, product)
    {
        if(!product){
            console.log("not found");
            res.json({ message: 'Not found'});
        }else{
            product.discount=req.body.discount || '0';
            var regArr =[];
        	Device.find({},function(err,devices){
        		for(var y=0;y<devices.length;y++){
        			if(devices[y].deviceType=="Android"){
        				regArr.push(devices[y].token);
        			}
        		}
        	});
            product.save(function(err)
            {
                if (err)
                {
                    res.send(err);
                }

                async.series([
                    async.asyncify(pushiPhone.sendPushes("Discount changed to " + product.discount)),
                    async.asyncify(pushAndroid.sendPushes("Discount changed to " + product.discount,regArr))
                ]);
                res.json({ message: 'Discount value changed!', newProduct : product});
            });
        }
    });
});

router.route('/placeOrder')
.post(function(req, res)
{
    var productIDArray = JSON.parse(req.body.productIds);
    var quantityArray = JSON.parse(req.body.quantityVals);
    if(productIDArray.length==quantityArray.length){
        var customerId =req.body.customerId;
        Product.find({ '_id' : { $in : productIDArray }},function(err, products){
            console.log({found:products});
            if(!products){
                res.json({ message: 'Invalid order' });
            }else{
                var order = new Order();
                var shopId="";
                var qProduct;
                for (var j=0; j<products.length; j++){
                    order.items.push({productId:productIDArray[j],quantity:quantityArray[j]});
                    console.log(productIDArray[j]+" "+order.items);
                    //diff product diff shopkeeper can be created here
                    shopId=products[j].userId;
                    var originalQ = products[j].quantity;
                    var orderQ=quantityArray[j];
                    products[j].quantity = originalQ-orderQ;
                    var finalPro=products[j];
                    finalPro.save(function(err)
                    {
                        if (err)
                        {
                            console.log(err +"product save error");
                        }
                    });
                }
                order.shopKeeperId=shopId,
                order.customerId=customerId,
                order.currentState='OrderReceived'
                order.save(function(err)
                {
                    if (err)
                    {
                        res.send(err);
                    }
                    console.log({newOrder : order});
                    res.json({ message: 'order Recieved' ,newOrder : order});
                });
            }
        });
    }else{
        res.json({ message: 'Array length not match'});
    }
});

router.route('/changeorder_state')
.post(function(req, res){
    Order.findOne({'_id':req.body.orderId },function(err, order){
        if(!order){
            res.json({ message: 'Invalid order' });
        }else{
            order.currentState=req.body.order_state;
            order.save(function(err)
            {
                if (err)
                {
                    res.send(err);
                }
                res.json({ message: 'order state changed' ,modifiedOrder : order});
            });
        }
    });
});

router.route('/findOrders')
.post(function(req, res){
    var type =req.body.usertype;
    if(type==='Customer'){
        Order.find({'customerId':req.body.userId },function(err, orders){
            if(!orders){
                res.json({ message: 'orders invalid for this user' });
            }else{
                res.json({ message:'orders found',Orders : orders});
            }
        });
    }else if (type==='Shopkeeper'){
        Order.find({'shopKeeperId':req.body.userId },function(err, orders){
            if(!orders){
                res.json({ message: 'orders invalid for this user' });
            }else{
                res.json({ message:'orders found', Orders : orders});
            }
        });
    }
});

router.post('/uploadImage', function(req, res) {
    var shopkeeperId=req.body.shopkeeperId;
    var productId=req.body.productId;
    var separator="/";
    var imageBuffer = new Buffer(req.body.imageFile, 'base64');
    var dir =__dirname+"/uploads/images/products/"+shopkeeperId+"/";
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    fs.writeFile(dir+productId+".png", imageBuffer, function(err) {
        if(err){
        res.json({'response':"Error"});
        }else {
        res.json({'response':"Saved"});
        }
    });
});

router.get('/downloadImage/:shopkeeperId/:productId', function (req, res){//:file/:userId/:complaintId..get
        var shopkeeperId=req.params.shopkeeperId;
        var productId = req.params.productId;
        var dirname = "/uploads/images/products/"+shopkeeperId+"/"+productId+".png";
        if (fs.existsSync( __dirname+dirname)){
            var img = fs.readFileSync( __dirname+dirname);
            res.writeHead(200, {'Content-Type': 'image/png' });
            res.end(img, 'binary');
        }


});
router.get('/productPicturesUpload', function(req, res){
  res.send('<form method="post" enctype="multipart/form-data">'
    + '<p>Title: <input type="text" name="title" /></p>'
    + '<p>Image: <input type="file" name="image" /></p>'
    + '<p><input type="submit" value="Upload" /></p>'
    + '</form>');
});

router.post('/productPicturesUpload', function(req, res, next){
  // create a form to begin parsing
  var form = new multiparty.Form();
  var image={};
  var title;//shopkeeperId/productId

  // We can add listeners for several form
  // events such as "progress"
  form.on('error', next);
  form.on('close', function(){
      res.send(format('\nuploaded %s (%d Kb) as %s'
        , image.filename
        , image.size / 1024 | 0
        , title));
  });
  // listen on field event for title
  form.on('field', function(name, val){
    if (name !== 'title') return;
    title = val;
  });
  // listen on part event for image file
  form.on('part', function(part){
    if (!part.filename) return;
    if (part.name !== 'image') return part.resume();

    image.filename = part.filename;
    console.log(part.byteCount+" : part.byteCount")
    image.size = 0;
    part.on('data', function(buf){
      image.size += buf.length;
    });
  });
  form.on('file', function(name,file){
    console.log('filename: ' + name);
    console.log('fileSize: '+ (file.size / 1024));
    var tmp_path = file.path
    var target_path =__dirname + '/uploads/images/products/' + title +'.png';
    var thumbPath = __dirname + '/uploads/thumbs/';
    fs.renameSync(tmp_path, target_path, function(err) {
        if(err) console.error(err.stack);
    });
     //res.redirect('./uploads/fullsize/'+name+'.JPG');
            console.log(target_path +" : target");
    /*gm(tmp_path)
        .resize(150, 150)
        .noProfile()
        .write(thumbPath + 'small.png', function(err) {
            if(err) console.error(err.stack);
        });*/
});
  // parse the form
  form.parse(req);
});

app.use('/api', router);
app.listen(3000);
console.log('Magic happens on port 3000');

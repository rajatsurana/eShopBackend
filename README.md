# eSubziBackend
Backend for CSP301

- mongod
- npm start || npm test depending on use case

## API endpoints
- http://localhost:3000/api/signup : to signup - provide email and password; returns token and user email
- http://localhost:3000/api/login : to signup - provide email and password; returns token
- pass the acquired token in headers[x-access-token] or query(?token='<token>') or body(token:<token>) in each of the next apis
- http://localhost:3000/api/products/create : to add product - POST ->price ,quantity, description, userId & discount
- http://localhost:3000/api/products/find : to list products of a shopkeeper- POST -> userId
- http://localhost:3000/api/update_price : to change price of product - POST -> _id & price
- http://localhost:3000/api/placeOrder : to place an order - POST -> productIds[], quantityVals[], customerId
- http://localhost:3000/api/change_order_state : to change discount amount - POST -> orderId, order_state
- http://localhost:3000/api/find_orders : to change discount amount - POST -> userId , usertype

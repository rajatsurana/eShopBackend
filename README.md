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
- http://localhost:3000/api/update_price : to change price of product - POST -> _id(id) & price
- http://localhost:3000/api/change_discount : to change discount of product - POST -> _id(id) & discount
- http://localhost:3000/api/placeOrder : to place an order - POST -> productIds[], quantityVals[], customerId
  pass this into params
                            Map<String, String> params = new HashMap<>();
                             JSONArray productIdsArr=new JSONArray();
                                JSONArray quantitiesArr= new JSONArray();
                                for(int x=0;x<productIds.length;x++){
                                        productIdsArr.put(productIds[x]);
                                        quantitiesArr.put(quantities[x]);
                                }
                                params.put("customerId",customerId);
                                params.put("productIds",productIdsArr.toString());
                                params.put("quantityVals",quantitiesArr.toString());
- http://localhost:3000/api/change_order_state : to change order state - POST -> orderId, order_state
  order_state: (OrderReceived OrderBeingProcessed Delivering Delivered)
- http://localhost:3000/api/find_orders : returns all orders of a particular shopkeeper or customer - POST -> userId , usertype

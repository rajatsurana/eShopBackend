# eSubziBackend
Backend for CSP301

- mongod
- npm start || npm test depending on use case

## API endpoints

- http://localhost:3000/api/products : to add product - POST ->price ,quantity & description
- http://localhost:3000/api/products : to list all products - GET
- http://localhost:3000/api/update_price : to change price of product - POST -> _id & price
- http://localhost:3000/api/change_discount : to change discount amount - POST -> _id & discount
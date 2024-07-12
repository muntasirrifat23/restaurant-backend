const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const SSLCommerzPayment = require('sslcommerz-lts');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;
const items = require('./items.json');
const jwt = require('jsonwebtoken');

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Muntasir Rifat');
});

app.get('/items', (req, res) => {
  res.send(items);
});

//
// const app = express();
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});


app.get('/items/:id', (req, res) => {
  const itemId = parseInt(req.params.id);
  const item = items.find(item => item.id === itemId);

  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  setTimeout(() => {
    res.json(item);
  }, 1000);
});

const uri = "mongodb+srv://restaurant:rifat913766@cluster0.20dr11o.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const store_id = process.env.SSL_STORE_ID;
const store_passwd = process.env.SSL_STORE_PASS;
const is_live = false;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();

    const userCollection = client.db("restaurantDB").collection("user");
    const reviewCollection = client.db("restaurantDB").collection("review");
    const cartCollection = client.db("restaurantDB").collection("cart");
    const reserveCollection = client.db("restaurantDB").collection("reserve");

     //JWT (Json Web Token)
     app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: '24h',
      });
      res.send({ token });
    });

    //middleware for jwt
    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'not access' });
        }
        req.decoded = decoded;
        next();
      });
    };
    

    //User 
    app.post('/user', async (req, res) => {
      const userData = req.body;
      const result = await userCollection.insertOne(userData);
      res.send(result);
    });

    app.get('/user',  async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.put('/user/:id', async (req, res) => {
      const id = req.params.id;
      const updateUser = req.body;
      console.log(updateUser);
    });

    app.delete('/user/:id', async (req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await userCollection.deleteOne(query);
      res.send(result);
    })

    // Make Admin
    app.patch('/user/admin/:id', async(req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updateUser = {
        $set:{
          role:'admin'
        }
      }
      const result = await userCollection.updateOne(filter, updateUser);
      res.send(result);
    })

    app.get('/user/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'no access' });
      }
    
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin });
    });
    

    // Review
    app.get('/review', async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
    });

    // Cart
    app.post('/cart', async (req, res) => {
      const cartData = req.body;
      // console.log(cartData);
      const result = await cartCollection.insertOne(cartData);
      res.send(result);
    });

    app.get('/cart', async (req, res) => {
      const userEmail = req.query.email;
      const result = await cartCollection.find({ email: userEmail }).toArray();
      res.send(result);
    });

    app.delete('/cart/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      if (result.deletedCount === 1) {
        res.status(200).json({ message: 'Item deleted successfully' });
      }
    });

    // Reserve
    app.post('/reserve', async (req, res) => {
      const reserveData = req.body;
      console.log(reserveData);
      const result = await reserveCollection.insertOne(reserveData);
      res.send(result);
    });

    app.get('/reserve', async (req, res) => {
      const result = await reserveCollection.find().toArray();
      // const userEmail = req.query.email;
      // const result = await cartCollection.find({ email: userEmail }).toArray();
      res.send(result);
    });

    // Payment
    app.post('/payment', async (req, res) => {
      const { totalAmount, productId } = req.body;
      console.log(`Received payment request for total amount: ${totalAmount} and product ID: ${productId}`);

      const data = {
        store_id: store_id,
        store_passwd: store_passwd,
        total_amount: totalAmount,
        currency: 'BDT',
        tran_id: 'unique_transaction_id', // generate unique transaction ID for each payment
        success_url: 'http://localhost:5000/payment/success',
        fail_url: 'http://localhost:5000/payment/fail',
        cancel_url: 'http://localhost:5000/payment/cancel',
        ipn_url: 'http://localhost:5000/payment/ipn',
        product_name: 'Sample Product',
        product_category: 'Sample Category',
        product_profile: 'general',
        cus_name: 'Customer Name',
        cus_email: 'customer@example.com',
        cus_add1: 'Customer Address',
        cus_city: 'Dhaka',
        cus_state: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        cus_phone: '01711111111',
        shipping_method: 'NO',
        num_of_item: 1,
        product_name: 'Test',
      };

      const sslcommerz = new SSLCommerzPayment(store_id, store_passwd, is_live);

      sslcommerz.init(data).then(response => {
        if (response.status === 'SUCCESS') {
          res.json({ status: 'SUCCESS', redirectURL: response.GatewayPageURL });
        } else {
          res.json({ status: 'FAILED', message: response.failedreason });
        }
      }).catch(err => {
        console.error(err);
        res.status(500n).json({ status: 'FAILED', message: 'Internal Server Error' });
      });
    });

    // Success route
    app.post('/payment/success', async (req, res) => {
      // Extract user email from the request
      const userEmail = req.body.value_c;

      // Clear the user's cart
      await cartCollection.deleteMany({ email: userEmail });

      // Redirect to home page
      res.redirect('/');
    });

    // Fail route
    app.post('/payment/fail', (req, res) => {
      // Handle the failure logic here
      console.log('Payment failed:', req.body);
      res.redirect('/');
    });

    // Cancel route
    app.post('/payment/cancel', (req, res) => {
      // Handle the cancel logic here
      console.log('Payment cancelled:', req.body);
      res.redirect('/');
    });

    // IPN route
    app.post('/payment/ipn', (req, res) => {
      // Handle the IPN logic here
      console.log('IPN received:', req.body);
      res.redirect('/');
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

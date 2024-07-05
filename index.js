const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const SSLCommerzPayment = require('sslcommerz-lts')

const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;
const items = require('./items.json');

// const stripe = require('stripe')("pk_test_51PYQnu2MI2zfqDyLp5ilg5jdGc1lnyegjoR9HoipdwlvHcO1aMg5XQeBWHLmJtKCPKTGrxjCCklmSu6HrDrpOhOc006OoEe1fm")

//middleware
//mongodb restaurant (rifat913766) ||rifat...
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Muntasir Rifat');
})

app.get('/items', (req, res) => {
  res.send(items);
})

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
//SSL
const store_id = process.env.SSL_STORE_ID;
const store_passwd = process.env.SSL_STORE_PASS;
const is_live = false;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
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

    // const database = client.db("restaurantDB");
    const userCollection = client.db("restaurantDB").collection("user");
    const reviewCollection = client.db("restaurantDB").collection("review");
    const cartCollection = client.db("restaurantDB").collection("cart");

    //Registration User Data Store
    app.post('/user', async (req, res) => {
      const userData = req.body;
      // console.log(user);
      const result = await userCollection.insertOne(userData);
      res.send(result);
    });
    app.get('/user', async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    app.put('user/:id', async (req, res) => {
      const id = req.params.id;
      const updateUser = req.body;
      console.log(updateUser);
    });

    //Review Data
    app.get('/review', async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
    });

    //Cart Data
    app.post('/cart', async(req, res)=>{
      const cartData= req.body;
      console.log(cartData );
      const result = await cartCollection.insertOne(cartData);
      res.send(result);
    });
    app.get('/cart', async(req, res)=>{
      const userEmail = req.query.email;
      const result = await cartCollection.find({email:userEmail}).toArray();
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

    //Payment  

    // STRIPE
    // app.post('/payment', async(req, res)=>{
    //   const {price} = req.body;
    //   const amount = parseInt(price*100);
    //   const paymentIntent = await stripe.paymentIntents.create({
    //     amount: amount,
    //     currency:'usd',
    //     payment_methods_type:['card']
    //   })
    //   res.send({
    //     clientSecrect : paymentIntent.client_secret,
    //   })
    // })


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
        res.status(500).json({ status: 'FAILED', message: 'Internal Server Error' });
      });
    });
    
     
       
    
      

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
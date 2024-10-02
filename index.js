const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const SSLCommerzPayment = require('sslcommerz-lts');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;
// const items = require('./items.json');
const jwt = require('jsonwebtoken');

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

//middle ware
app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
  res.send('Muntasir Rifat');
});

// app.get('/items', (req, res) => {
//   res.send(items);
// });

app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
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

    const itemCollection = client.db("restaurantDB").collection("items");
    const userCollection = client.db("restaurantDB").collection("user");
    const reviewCollection = client.db("restaurantDB").collection("review");
    const cartCollection = client.db("restaurantDB").collection("cart");
    const reserveCollection = client.db("restaurantDB").collection("reserve");
    const feedbackCollection = client.db("restaurantDB").collection("feedback");
    const paymentCollection = client.db("restaurantDB").collection("payment");

    //Items
    app.get('/items',  async (req, res) => {
      const result = await itemCollection.find().toArray();
      res.send(result);
    });

    //Items Details
    app.get('/items/:id', async (req, res) => {
      const itemId = parseInt(req.params.id);
        const item = await itemCollection.findOne({ id: itemId });
        if (!item) {
          return res.status(404).json({ error: 'Item not found' });
        }
        res.json(item);
    });

    //Items Update 
     app.get('/items/:id/update',async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await itemCollection.findOne(query);
      console.log(result);
      res.send(result);
    });

    app.put('/items/:id', async(req,res)=>{
      const id= req.params.id;
      const filter ={_id: new ObjectId(id)};
      const options ={upsert: true};
      const updateItem = req.body;
      // console.log(updateItem);
      const update={
        $set:{
          name:updateItem.name,
          price:updateItem.price,
          short_details:updateItem.short_details,
          long_details:updateItem.long_details,
          rating:updateItem.rating,
          origin:updateItem.origin
        }
      }
      const result = await itemCollection.updateOne(filter, update,options );
      res.send(result);
    })

    //Items Delete 
    app.delete('/items/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await itemCollection.deleteOne(query);
      if (result.deletedCount === 1) {
        res.status(200).json({ message: 'Item deleted successfully' });
      }
    });

    //Add Items
    // app.post('/items', async (req, res) => {
    //   const AddUpdateData = req.body;
    //   console.log(AddUpdateData);
    //   const result = await itemCollection.insertOne(AddUpdateData);
    //   res.send(result);
    // });

    app.post('/items', upload.single('image'), async (req, res) => {
      const AddUpdateData = {
        name: req.body.name,
        price: parseFloat(req.body.price),
        short_details: req.body.short_details,
        long_details: req.body.long_details,
        rating: parseFloat(req.body.rating),
        origin: req.body.origin,
        image: req.file ? req.file.buffer.toString('base64') : null, // Store image as base64
      };
    
      try {
        const result = await itemCollection.insertOne(AddUpdateData);
        res.send(result);
      } catch (error) {
        console.error("Error inserting item:", error);
        res.status(500).send("Internal Server Error");
      }
    });

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

    //Feedback
    app.post('/feedback', async(req, res)=>{
      const feedbackData = req.body;
      // console.log(feedbackData);
      const result = await feedbackCollection.insertOne(feedbackData);
      res.send(result);
    })

    app.get('/feedback', async(req, res)=>{
      const result= await feedbackCollection.find().toArray();
      res.send(result);
    })

     // Feedback Delete Single 
     app.delete('/feedback/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await feedbackCollection.deleteOne(query);
      if (result.deletedCount === 1) {
        res.status(200).json({ message: 'Item deleted successfully' });
      } else {
        res.status(404).json({ message: 'Item not found' });
      }
    });

    //Feedback Delete All
    app.delete('/feedback', async (req, res) => {
      const result = await feedbackCollection.deleteMany({});
      if (result.deletedCount > 0) {
        res.status(200).json({ message: `${result.deletedCount} items deleted successfully` });
      } else {
        res.status(404).json({ message: 'No items found to delete' });
      }
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
        res.status(200).json({ message: 'Cart deleted successfully' });
      }
    });

    // Reserve
    app.post('/reserve', async (req, res) => {
      const reserveData = req.body;
      // console.log(reserveData);
      const result = await reserveCollection.insertOne(reserveData);
      res.send(result);
    });

    app.get('/reserve', async (req, res) => {
      const result = await reserveCollection.find().toArray();
      res.send(result);
    });

    // Reserve Delete Single 
    app.delete('/reserve/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reserveCollection.deleteOne(query);
      if (result.deletedCount === 1) {
        res.status(200).json({ message: 'Item deleted successfully' });
      } else {
        res.status(404).json({ message: 'Item not found' });
      }
    });

    //Reserve Delete All
    app.delete('/reserve', async (req, res) => {
      const result = await reserveCollection.deleteMany({});
      if (result.deletedCount > 0) {
        res.status(200).json({ message: `${result.deletedCount} items deleted successfully` });
      } else {
        res.status(404).json({ message: 'No items found to delete' });
      }
    });

    //Admin Home
    app.get('/admin-home', async(req,res)=>{
      const users = await userCollection.estimatedDocumentCount();
      const items = await itemCollection.estimatedDocumentCount();
      const reserve = await reserveCollection.estimatedDocumentCount();
      const feedback = await feedbackCollection.estimatedDocumentCount();
      const payment = await paymentCollection.estimatedDocumentCount();
      const review = await reviewCollection.estimatedDocumentCount();
      // RESERVE, FEEDBACK

      res.send({
        users,
        items,
        reserve, 
        feedback, 
        payment,
        review
      })
    })

    // Payment
    app.post('/payment', async (req, res) => {
      const { totalAmount, productId, userInfo } = req.body;
      console.log(`Total amount: ${totalAmount}, Product ID: ${productId} and User Info:${userInfo}` );

      const data = {
        store_id: store_id,
        store_passwd: store_passwd,
        total_amount: totalAmount,
        currency: 'BDT',
        tran_id: 'unique_transaction_id',
        success_url: 'http://localhost:5000/payment/success',
        fail_url: 'http://localhost:5000/payment/fail',
        cancel_url: 'http://localhost:5000/payment/cancel',
        ipn_url: 'http://localhost:5000/payment/ipn',
        product_name: 'Sample Product',
        product_category: 'Sample Category',
        product_profile: 'general',
        cus_name: 'Customer Name',
        cus_email: userInfo,
        cus_city: 'Dhaka',
        cus_state: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        cus_phone: '01711111111',
        shipping_method: 'NO',
        num_of_item: 1,
        value_a: userInfo, // Pass the email here
      };
      
      console.log(data);

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
  try {
    console.log('Received payment data:', req.body);
    
    const paymentData = req.body;

    const paymentDetails = {
      transaction_id: paymentData.tran_id || null,
      status: paymentData.status || null,
      amount: paymentData.amount || null,
      currency: paymentData.currency || null,
      payment_method: paymentData.card_type || 'N/A',
      user_email: paymentData.value_a || null,  // Use value_a to get the email
      payment_date: new Date(),
    };

    console.log('Payment details to be saved:', paymentDetails);
    const result = await paymentCollection.insertOne(paymentDetails);
    console.log('Payment details saved:', result);    
    
    if (paymentDetails.user_email) {
      await cartCollection.deleteMany({ email: paymentDetails.user_email });
      console.log('User cart cleared:', paymentDetails.user_email);
    } else {
      console.warn('User email is null, skipping cart clearance.');
    }

    // Redirect to success page
    res.redirect('http://localhost:5173/');
  } catch (error) {
    console.error('Error processing payment success:', error);
    res.status(500).send('Internal Server Error');
  }
});


    

    // Fail route
    app.post('/payment/fail', async (req, res) => {
      try {
        console.log('Payment failed:', req.body);
        const paymentData = req.body;
        const paymentDetails = {
          transaction_id: paymentData.tran_id || null,
          status: paymentData.status || 'FAILED',
          amount: paymentData.amount || null,
          currency: paymentData.currency || null,
          payment_method: paymentData.card_type || 'N/A',
          user_email: paymentData.value_a || null,  // Use value_a to get the email
          payment_date: new Date(),
        };

        const result = await paymentCollection.insertOne(paymentDetails);
        console.log('Failed payment:', result);    

    
        res.status(200).send('Payment Failed');
  } catch (error) {
    console.error('Error handling payment failure:', error);
    res.status(500).send('Internal Server Error');
  }
    });
    

    // Cancel route
    app.post('/payment/cancel', async (req, res) => {
      try {
        console.log('Payment cancelled:', req.body);
    
        // Optional: Update payment status in the database
        const paymentData = req.body;
        const paymentDetails = {
          transaction_id: paymentData.tran_id || null,
          status: paymentData.status || 'CANCELLED',
          amount: paymentData.amount || null,
          currency: paymentData.currency || null,
          payment_method: paymentData.card_type || 'N/A',
          user_email: paymentData.cus_email || null,
          payment_date: new Date(),
        };
    
        // Log the cancellation or update database
        await paymentCollection.insertOne(paymentDetails);
        
        // Optional: Notify the user or take further action
        // ...
    
        // Redirect to a cancellation page
        res.redirect('/payment-cancel'); // Replace with your cancellation page URL
      } catch (error) {
        console.error('Error handling payment cancellation:', error);
        res.status(500).send('Internal Server Error');
      }
    });
    
    // IPN route
    app.post('/payment/ipn', async (req, res) => {
      try {
        console.log('IPN received:', req.body);
    
        // Verify IPN message (implementation depends on your payment gateway)
        // ...
    
        // Process the IPN message
        const paymentData = req.body;
        const paymentDetails = {
          transaction_id: paymentData.tran_id || null,
          status: paymentData.status || 'IPN_RECEIVED',
          amount: paymentData.amount || null,
          currency: paymentData.currency || null,
          payment_method: paymentData.card_type || 'N/A',
          user_email: paymentData.cus_email || null,
          payment_date: new Date(),
        };
    
        // Log the IPN or update database
        await paymentCollection.insertOne(paymentDetails);
        
        // Optional: Take further action based on IPN data
        // ...
    
        // Respond to the IPN message
        res.status(200).send('IPN Received'); // or appropriate response based on gateway requirements
      } catch (error) {
        console.error('Error handling IPN:', error);
        res.status(500).send('Internal Server Error');
      }
    });

    //Payment Data 

    app.get('/paymentData',  async (req, res) => {
      const result = await paymentCollection.find().toArray();
      res.send(result);
    });

    app.delete('/paymentData/:id', async (req, res) => {
      const { id } = req.params;
      const result = await paymentCollection.deleteOne({ _id: new ObjectId(id) });
    
      if (result.deletedCount === 1) {
        res.status(200).send({ message: 'Payment deleted successfully' });
      } else {
        res.status(404).send({ message: 'Payment not found' });
      }
    });

    app.delete('/paymentData', async(req,res)=>{
      const result = await paymentCollection.deleteMany({});
      res.status(200).send({ message: `${result.deletedCount} payments deleted successfully` });
    })
    
    
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

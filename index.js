const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
const items = require('./items.json');

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
    })
    app.get('/user', async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    })
    app.put('user/:id', async (req, res) => {
      const id = req.params.id;
      const updateUser = req.body;
      console.log(updateUser);
    })

    //Review Data
    app.get('/review', async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
    })

    //Cart Data
    app.post('/cart', async(req, res)=>{
      const cartData= req.body;
      console.log(cartData );
      const result = await cartCollection.insertOne(cartData);
      res.send(result);
    })
    app.get('/cart', async(req, res)=>{
      const result = await cartCollection.find().toArray();
      res.send(result);
    })

   

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
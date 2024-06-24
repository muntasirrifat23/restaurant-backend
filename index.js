const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
const item = require('./items.json');

//middleware
//mongodb restaurant (rifat913766) ||rifat...
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Muntasir Rifat');
})

app.get('/item', (req, res) => {
  res.send(item);
})

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const database = client.db("userDB");
    const userCollection = database.collection("user");
    // const userCollection = client.db
//Registration Data Store
    app.post('/user',async (req, res)=>{
      const user = req.body;
      console.log(user);
      const result =  await userCollection.insertOne(user);
      res.send(result);
    })

    app.get('/user', async(req, res) => {
      const getUser = userCollection.find();
      const result = await getUser.toArray();
      res.send(result);
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close(); also check successfully connected 
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
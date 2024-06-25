const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
 

// middle ware 
app.use(cors());
app.use(express.json());
// app.use((req, res, next) => {
//   res.setHeader("Content-Security-Policy", "default-src 'none'; font-src 'self' https://fonts.gstatic.com; style-src 'self' https://fonts.googleapis.com;");
//   next();
// });


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.2vx7h3g.mongodb.net/?appName=Cluster0`;

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

    const serviceCollection = client.db('carDoctor').collection('services');
    const bookingCollection = client.db('carDoctor').collection('bookings');


    app.get('/services', async(req, res) =>{
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })


    // load specific service 
    app.get('/services/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const options = {
        projection : {title: 1, price: 1, service_id: 1, img: 1}
      }
      const result = await serviceCollection.findOne(query, options);
      res.send(result);
    })

    // bookings
    app.post('/bookings', async(req, res) =>{
      const booking = req.body;
      console.log(booking);
      const result = await bookingCollection.insertOne(booking);
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


app.get('/', (req, res) =>{
  res.send('doctor is running');
})

app.listen(port, () =>{
  console.log(`Car doctor Server is running on port ${port}`);
})

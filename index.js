const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express();
const port = process.env.PORT || 5000;
 

// middle ware 
app.use(cors({
  origin: [
    'car-doctor-4eec9.web.app',
    'car-doctor-4eec9.firebaseapp.com'
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());





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

//middle ware create by i 
const logger = async(req, res, next) =>{
  console.log('called:', req.host, req.originalUrl);
  next();
};

const verifyToken = (req, res, next) =>{
  const token = req?.cookies?.token;
  // console.log('token in the middleware', token);
  if(!token){
    return req.status(401).send({message: 'unauthorized access'});
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
    if(err){
      return res.status(401).send({message: 'unauthorized access'});
    }
    req.user = decoded;
    next();
  }) 
}


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const serviceCollection = client.db('carDoctor').collection('services');
    const bookingCollection = client.db('carDoctor').collection('bookings');

    //auth related api
    app.post('/jwt', async(req, res)=>{
      const user = req.body;
      console.log('user for token', user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
      res
      .cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      })
      .send({message: true});
    })

    app.post('/logout', async(req, res)=>{
      const user = req.body;
      console.log('user from logout', user);
      res.clearCookie('token', {maxAge: 0}).send({success: true})
    });

    // services related api 
    app.get('/services', logger,  async(req, res) =>{
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

    app.get('/bookings', logger, verifyToken, async(req, res) =>{
      // console.log(req.query.email);
      // console.log('token owner info', req.user);
      if(req.user.email !== req.query.email){
        return res.status(403).send({message: 'forbidden access'})
      };
      let query = {};
      if(req.query?.email){
        query = {email: req.query.email}
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    })
    app.post('/bookings', async(req, res) =>{
      const booking = req.body;
      console.log(booking);
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    })

    app.patch('/bookings/:id', async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updatedBooking = req.body;
      console.log(updatedBooking);
      const updateDoc = {
        $set: {
          status : updatedBooking.status
        },
      };
      const result = await bookingCollection.updateOne(filter, updateDoc);
      res.send(result);
    })

    // delete booking 
    app.delete('/bookings/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await bookingCollection.deleteOne(query);
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


























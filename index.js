const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
// const morgan = require('morgan')
const port = process.env.PORT || 5000

// middleware
const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174',
    'https://assignment-12-981d3.web.app','https://assignment-12-981d3.firebaseapp.com'],
    credentials: true,
    optionSuccessStatus: 200,
  }
  app.use(cors(corsOptions))
  app.use(express.json())
  app.use(cookieParser())
  // app.use(morgan('dev'))


  const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token
    console.log(token)
    if (!token) {
      return res.status(401).send({ message: 'unauthorized access' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        console.log(err)
        return res.status(401).send({ message: 'unauthorized access' })
      }
      req.user = decoded
      next()
    })
  }

  const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rmje4mv.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

    const usersCollection = client.db('A12db').collection('user')
    const petsCollection = client.db('A12db').collection('allPets')
    const allDonationCollection = client.db('A12db').collection('donation')
    const userPetCollection = client.db('A12db').collection('usersPet')


  async function run() {
    try {

      // jwt
      app.post('/jwt', async (req, res) => {
        const user = req.body
        console.log('New Token', user)
        
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: '10d',
        })
        res
          .cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          })
          .send({ success: true })
      })
  
      // Logout
      app.get('/logout', async (req, res) => {
        try {
          res
            .clearCookie('token', {
              maxAge: 0,
              secure: process.env.NODE_ENV === 'production',
              sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            })
            .send({ success: true })
          console.log('Logout successful')
        } catch (err) {
          res.status(500).send(err)
        }
      })
  
      // Save user & email DB
      app.put('/users/:email', async (req, res) => {
        const email = req.params.email
        const user = req.body
        const query = { email: email }
        const options = { upsert: true }
        const isExist = await usersCollection.findOne(query)
        console.log('Users found In the DataBase?', isExist)
        if (isExist) return res.send(isExist)
        const result = await usersCollection.updateOne(
          query,
          {
            $set: { ...user, timestamp: Date.now() },
          },
          options
        )
        res.send(result)
      })

      app.get('/users', async (req, res) => {
        const email = req.body
        const result = await usersCollection.find(email).toArray();
        res.send(result)
      })

     //role
      app.get('/user/:email', async (req, res) => {
        const email = req.params.email
        const result = await usersCollection.findOne({ email })
        res.send(result)
      })


      //delete user 
      app.delete('/users/:id',  async (req, res) => {
        const id = req.params.id
        const query = { _id: new ObjectId(id) }
        const result = await usersCollection.deleteOne(query);
        res.send(result);
      })


      app.get ('/Pets', async (req,res) => {
        const pets = req.body
        const result = await petsCollection.find(pets).toArray();
        res.send(result);
      })

      app.get('/Pets/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await petsCollection.findOne(query)
        res.send(result);
    })
      app.get ('/allDonation', async (req,res) => {
        const donation = req.body
        const result = await allDonationCollection.find(donation).toArray();
        res.send(result);
      })

      app.get('/allDonation/:id', async (req, res) => {
        const donationId = req.params.id;
        const query = { _id: new ObjectId(donationId) };
        const result = await allDonationCollection.findOne(query)
        res.send(result);
    })


    app.post('/addPets',  async (req, res) => {
      const pet = req.body
      const result = await userPetCollection.insertOne(pet)
      res.send(result)
    })

    app.get ('/getPets', async (req,res) => {
      const pets = req.body
      const result = await userPetCollection.find(pets).toArray();
      res.send(result);
    })

    app.get('/getPets/:id', async (req, res) => {
      const petsId = req.params.id;
      const query = { _id: new ObjectId(petsId) };
      const result = await userPetCollection.findOne(query)
      res.send(result);
  })

  app.patch ('/getPets/:id' , async (req , res) => {
  const pets = req.body ;
  const id = req.params.id;
  const filter = {_id: new ObjectId(id) }
const updatedDoc = {
  $set:{
    name:pets.name,
    category:pets.category,
    age:pets.age,
    image:pets.image,
    location:pets.location,
    date:pets.date,
    shortDescription: pets.shortDescription,
    longDescription:pets.longDescription
  }
}

const result = await userPetCollection.updateOne(filter, updatedDoc)
res.send (result)
  })


    //delete pets from dashboard
    app.delete('/pets/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await userPetCollection.deleteOne(query);
      res.send(result);
    })

    
      await client.db('admin').command({ ping: 1 }) // TODO: comment this line before deploy
      console.log( 'Pinged your deployment. You successfully connected to MongoDB!')
    } finally {
      
      // await client.close();
    }
  }
  run().catch(console.dir)
  
  app.get('/', (req, res) => {
    res.send('From A12 Server..!')
  })
  
  app.listen(port, () => {
    console.log(`A12 Server is running on port ${port}`)
  })
  
const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
// const morgan = require('morgan')
const port = process.env.PORT || 5000

// middleware
const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
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


  async function run() {
    try {

     
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
        console.log('Users found?', isExist)
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


      app.get ('/Pets', async (req,res) => {
        const pets = req.body
        const result = await petsCollection.find(pets).toArray();
        res.send(result);
      })


  
      
      await client.db('admin').command({ ping: 1 })
      console.log(
        'Pinged your deployment. You successfully connected to MongoDB!'
      )
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
  
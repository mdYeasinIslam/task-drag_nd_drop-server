require('dotenv').config()
const express = require('express')
const cors = require('cors')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.db_user}:${process.env.db_pass}@cluster0.bfv30pl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const port = process.env?.PORT || 5000


app.use(cors())
app.use(express.json())


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
      const database = client.db('drag-nd-drop-task')
      const userCollection =database.collection('usersData')
      const taskCollection = database.collection('taskData')
    
    // Users Data
      app.post('/usersInfo', async (req, res) => {
          const body = req.body;
          console.log(body)
          const findUser = { email: body.email }
          const findFromDB = await userCollection.findOne(findUser)
          console.log(findFromDB)
          if (findFromDB) {
              return res.send('The user already in database')
          }
          const result = await userCollection.insertOne(body);
          res.send(result)
      })
      
    //Task data
      app.post('/tasks', async (req, res) => {
        const body = req.body;
        console.log(body)
        const result = await taskCollection.insertOne(body)
        res.send(result)
      })
    app.get('/tasks', async (req, res) => {
      const result = await taskCollection.find().toArray()
      res.send(result)
    })
    app.put('/tasks/:id', async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const find = { _id: new ObjectId(id) }
      const findTask = await taskCollection.findOne(find);
      const doc = {
        $set: {
          category: body.category
        }
      }
      const result = await taskCollection.updateOne(find, doc)
      res.send(result)
    })
    app.delete('/tasks/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const result = await taskCollection.deleteOne(filter)
      res.send(result)
    })
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('server is running properly')
})

app.listen(port,()=>console.log('server is runnig on ',port))
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const app = express()
// --------------------------------
// const http = require("http");
// const { Server } = require("socket.io");
// --------------------------------

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { title } = require('process');

const uri = `mongodb+srv://${process.env.db_user}:${process.env.db_pass}@cluster0.bfv30pl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const PORT = process.env?.PORT || 5000


  app.use(cors({
    origin: [
      "http://localhost:5173",
    'https://drag-nd-drop-task.netlify.app'
  ],
  credentials: true,
}))
app.use(express.json())


// -------------------------------------------------------------------
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: [
//       "http://localhost:5173",  // Your development client URL
//       "https://drag-nd-drop-task.netlify.app", // Your production URL
//     ],
//     methods: ["GET","POST","DELETE","PUT"], // Add the methods if needed
//     credentials: true, // If you need credentials (cookies, authorization headers)
//   },
// });
// ----------------------------------------------------------------------------------

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
      // await client.connect();
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
        // const { uid, title, details, date, userEmail, category } = body;
        
        // const findTask =await taskCollection.findOne({ title: title });
        // console.log(findTask)
        
        //   // const lastTask=  findTask.sort("-order")
        // const order = findTask ? findTask.order + 1 : 0;
        // console.log(order)
        //   const taskInfo={
        //     uid,
        //     title,
        //     details,
        //     date,
        //     order,
        //     category,
        //     userEmail,
        //    }
        const result = await taskCollection.insertOne(body)
        return  res.send(result)
      

      })
    app.get('/tasks', async (req, res) => {
      const email = req.query.email;
      const filter = {userEmail: email}
      const result = await taskCollection.find(filter).toArray()
      res.send(result)
    })
    app.put('/tasks/:id', async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const find = { _id: new ObjectId(id) }
      const options = { upsert: true };
        const doc = {
        $set: {
            category: body.category,
          }
        }
        const result = await taskCollection.updateOne(find, doc, options)
       return res.send(result)
      
    })
    
    app.put('/taskUpdate/:id', async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const find = { _id: new ObjectId(id) }
      const options = { upsert: true };
        const doc = {
          $set: {
            title:body.title,
            details: body.details,
            date:body.date
          }
        }
        const result = await taskCollection.updateOne(find, doc, options)
        res.send(result)
      
    })
    
    app.delete('/tasks/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const result = await taskCollection.deleteOne(filter)
      res.send(result)
    })
    // ================================================================
    app.put('/reOrder', async (req, res) => {
     try {
    const { taskId, newCategory, oldCategory, newIndex, oldIndex } = req.body;


    const task = await taskCollection.findOne({ _id: new ObjectId(taskId) });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.category !== newCategory) {
      await taskCollection.updateMany(
        { category: oldCategory, order: { $gt: oldIndex } },
        { $inc: { order: -1 } }
      );

      await taskCollection.updateMany(
        { category: newCategory, order: { $gte: newIndex } },
        { $inc: { order: 1 } }
      );

      await taskCollection.updateOne(
        { _id: new ObjectId(taskId) },
        { $set: { category: newCategory, order: newIndex } }
      );
    } else {
      if (newIndex > oldIndex) {
        await taskCollection.updateMany(
          { category: task.category, order: { $gt: oldIndex, $lte: newIndex } },
          { $inc: { order: -1 } }
        );
      } else {
        await taskCollection.updateMany(
          { category: task.category, order: { $gte: newIndex, $lt: oldIndex } },
          { $inc: { order: 1 } }
        );
      }

      await taskCollection.updateOne(
        { _id: new ObjectId(taskId) },
        { $set: { order: newIndex } }
      );
    }
    task.order = newIndex;

    await task.save();
    res.status(200).json({ message: "Task position updated" });
  } catch (error) {
    res.status(500).json({ message: "Error updating task order", error });
  }
    })

// ============================================================================
    // ------------------------------------------------------------------
    // WebSocket Connection
    // io.on("connection", (socket) => {
    //   // console.log("A user connected:", socket.id);

    //   socket.on("disconnect", () => {
    //     console.log("A user disconnected:", socket.id);
    //   });
    // });

    // // MongoDB Change Streams for Real-Time Updates
    // const changeStream = taskCollection.watch();
    // changeStream.on("change", (change) => {
    //   console.log("Change detected:", change);

    //   if (change.operationType === "insert") {
    //     io.emit("taskAdded", change.fullDocument);
    //   } else if (change.operationType === "update") {
    //     io.emit("taskUpdated", {
    //       _id: change.documentKey._id,
    //       ...change.updateDescription.updatedFields,
    //     });
    //   } else if (change.operationType === "delete") {
    //     io.emit("taskDeleted", change.documentKey._id);
    //   }
    // });

    // ------------------------------------------------------------
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('server is running properly')
})

app.listen(PORT,()=>console.log(`server is runnig on ${PORT}`))
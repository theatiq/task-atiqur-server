const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000', // Your React frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.use(cors());
app.use(express.json());

const mongoUrl = 'mongodb://localhost:27017'; // Your MongoDB connection
const client = new MongoClient(mongoUrl);
const dbName = 'taskManager';
let tasksCollection;

client.connect().then(() => {
  const db = client.db(dbName);
  tasksCollection = db.collection('tasks');
});

// Fetch all tasks
app.get('/tasks', async (req, res) => {
  const tasks = await tasksCollection.find({}).toArray();
  res.json(tasks);
});

// Update a task (e.g., change category)
app.put('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const updatedTask = req.body;

  try {
    await tasksCollection.updateOne({ _id: new ObjectId(id) }, { $set: updatedTask });
    const tasks = await tasksCollection.find({}).toArray();
    io.emit('taskUpdated', tasks); // Broadcast updated tasks to all clients
    res.json({ message: 'Task updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete a task
app.delete('/tasks/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await tasksCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 1) {
      const tasks = await tasksCollection.find({}).toArray();
      io.emit('taskUpdated', tasks); // Broadcast updated tasks to all clients
      res.json({ message: 'Task deleted' });
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Start the server
server.listen(5000, () => {
  console.log('Server is running on http://localhost:5000');
});































const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB connection
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);
let tasksCollection;

async function connectDB() {
  try {
    await client.connect();
    const db = client.db('taskdb'); // Use 'taskdb' database
    tasksCollection = db.collection('tasks'); // Use 'tasks' collection
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
  }
}
connectDB();

// -------------------- API Endpoints --------------------

// 1. Add a new task
app.post('/tasks', async (req, res) => {
  const { title, description, category } = req.body;
  const newTask = {
    title,
    description,
    category: category || 'To-Do',
    timestamp: new Date(),
  };

  try {
    const result = await tasksCollection.insertOne(newTask);
    res.status(201).json(result.ops[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add task' });
  }
});

// 2. Get all tasks
app.get('/tasks', async (req, res) => {
  try {
    const tasks = await tasksCollection.find().toArray();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// 3. Update a task
app.put('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const updatedTask = req.body;

  try {
    const result = await tasksCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedTask }
    );
    if (result.modifiedCount === 1) {
      res.json({ message: 'Task updated' });
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// 4. Delete a task
app.delete('/tasks/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await tasksCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 1) {
      res.json({ message: 'Task deleted' });
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});



const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 5001 }); // WebSocket server on port 5001

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  ws.send(JSON.stringify({ message: 'Connected to WebSocket' }));

  // You can broadcast messages to all clients on specific events
  ws.on('message', (data) => {
    console.log('Received:', data);
  });
});

// Function to broadcast changes to all connected WebSocket clients
const broadcastUpdate = (update) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(update));
    }
  });
};

// Modify CRUD endpoints to broadcast updates (e.g., after adding or deleting a task)

// Example: Broadcast after adding a new task
app.post('/tasks', async (req, res) => {
  const { title, description, category } = req.body;
  const newTask = {
    title,
    description,
    category: category || 'To-Do',
    timestamp: new Date(),
  };

  try {
    const result = await tasksCollection.insertOne(newTask);
    res.status(201).json(result.ops[0]);

    // Broadcast the new task to all clients
    broadcastUpdate({ type: 'ADD_TASK', task: result.ops[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add task' });
  }
});

















// require("dotenv").config()
// const express = require('express');
// const cors = require('cors');
// const jwt = require('jsonwebtoken');
// const cookieParser = require('cookie-parser');
// const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const app = express()
// const port = process.env.PORT || 5000

// app.use(cors({
//     origin: ['http://localhost:5173', 'https://atiqurstech.web.app', 'https://atiqurstech.firebaseapp.com'],
//     credentials: true
// }))
// app.use(express.json())
// app.use(cookieParser())


// const verifyToken = (req, res, next) => {
//     const token = req.cookies?.token
//     // console.log("token inside verify", token)
//     if (!token) {
//         return res.status(401).send({ message: "unauthorized access" })
//     }
//     jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
//         if (err) {
//             return res.status(401).send({ message: "unauthorized access" })
//         }
//         req.user = decoded
//         req.email = decoded.email

//         next()
//     })
// }



// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hnhnv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// // const uri = "mongodb+srv://<db_username>:<db_password>@cluster0.hnhnv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// // Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, {
//     serverApi: {
//         version: ServerApiVersion.v1,
//         strict: true,
//         deprecationErrors: true,
//     }
// });

// async function run() {
//     try {
//         // Connect the client to the server	(optional starting in v4.7)
//         // await client.connect();
//         const blogsCollection = client.db("blogsDB").collection('blogs')
//         const wishListCollection = client.db("blogsDB").collection("wishList")
//         const commentCollection = client.db("blogsDB").collection("comments")

//         app.post("/jwt", (req, res) => {
//             const user = req.body
//             const token = jwt.sign(user, process.env.TOKEN_SECRET, { expiresIn: '1y' })


//             res.cookie('token', token, {
//                 httpOnly: true,
//                 secure: process.env.NODE_ENV === 'production',
//                 sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
//             })
//                 .send({ success: true })
//         })

//         app.post("/logout", (req, res) => {
//             res.clearCookie("token", {
//                 httpOnly: true,
//                 secure: process.env.NODE_ENV === 'production',
//                 sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
//             })
//                 .send({ success: true })
//         })



//         // Get All Blogs
//         app.get("/blogs", async (req, res) => {
//             const cursor = blogsCollection.find()
//             const result = await cursor.toArray()
//             res.send(result)
//         })
//         // For home Page
//         app.get("/blogsHome", async (req, res) => {
//             const cursor = blogsCollection.find().sort({ postedDate: -1 }).limit(6)
//             const result = await cursor.toArray()
//             res.send(result)
//         })
//         // For feature Page
//         app.get("/blogsFeatured", async (req, res) => {
//             const cursor = [
//                 {
//                     $addFields: {
//                         longDescriptionLength: { $strLenCP: "$longDescription" },
//                     },
//                 },
//                 {
//                     $sort: { longDescriptionLength: -1 },
//                 },
//                 {
//                     $limit: 10,
//                 },
//                 {
//                     $project: {
//                         longDescriptionLength: 0,
//                     },
//                 },
//             ]
//             const result = await blogsCollection.aggregate(cursor).toArray()
//             res.send(result)
//         })


//         app.get("/blogs/:id", async (req, res) => {
//             const id = req.params.id
//             const query = { _id: new ObjectId(id) }
//             const result = await blogsCollection.findOne(query)
//             res.send(result)
//         })

//         app.get("/comments", async (req, res) => {
//             try {
//                 const blogId = req.query.blogId; // Retrieve blogId from query parameter
//                 if (!blogId) {
//                     return res.status(400).send({ message: "blogId is required" });
//                 }

//                 const query = { blogId }; // Filter comments by blogId
//                 const comments = await commentCollection.find(query).toArray(); // Convert cursor to array
//                 res.status(200).send(comments); // Send filtered comments
//             } catch (error) {
//                 console.error("Error fetching comments:", error);
//                 res.status(500).send({ message: "Failed to fetch comments", error });
//             }
//         });

//         app.get("/wishList", async (req, res) => {
//             const cursor = wishListCollection.find()
//             const result = await cursor.toArray()
//             res.send(result)
//         })


//         app.get("/wishList/:id", async (req, res) => {
//             const id = req.params.id
//             const query = { _id: new ObjectId(id) }
//             const result = await wishListCollection.findOne(query)
//             res.send(result)
//         })



//         // My Reviews
//         app.get("/myReviews", async (req, res) => {
//             const email = req.query.email
//             const filter = { email }
//             const result = await blogsCollection.find(filter).toArray()
//             res.send(result)
//         })
//         // My Wish List
//         app.get("/myWishList", verifyToken, async (req, res) => {
//             const email = req.email
//             const filter = { email }
//             const result = await wishListCollection.find(filter).toArray()
//             res.send(result)
//         })
//         // app.get("/myWishList",verifyToken, async (req, res) => {
//         //     const email = req.query.email
//         //     const filter = { email }
//         //     const result = await wishListCollection.find(filter).toArray()
//         //     res.send(result)
//         // })

//         // Add New Post
//         app.post("/addPost", verifyToken, async (req, res) => {
//             const newPost = req.body
//             const result = await blogsCollection.insertOne(newPost)
//             res.send(result)
//         })


//         app.post("/wishList", async (req, res) => {
//             // const id = req.params.id
//             const wishList = req.body
//             const result = await wishListCollection.insertOne(wishList)
//             res.send(result)
//         })

//         // Post  comments
//         app.post("/comment", async (req, res) => {
//             const commentData = req.body
//             try {
//                 const result = await commentCollection.insertOne(commentData)
//                 res.status(201).send(result)
//             } catch (error) {
//                 console.log("Error adding comment: ", error)
//                 res.status(500).send({ Message: "Server Error. Please try again later." })
//             }
//         })

//         app.put("/update/:id", verifyToken, async (req, res) => {
//             const id = req.params.id
//             const filter = { _id: new ObjectId(id) }
//             const options = { upsert: true };
//             const newPost = req.body
//             const updatedPost = {
//                 $set: newPost
//             }
//             const result = await blogsCollection.updateOne(filter, updatedPost, options)
//             res.send(result)
//         })
//         // Delete a Blog
//         app.delete("/blog/:id", async (req, res) => {
//             const id = req.params.id
//             const query = { _id: new ObjectId(id) }
//             const result = await blogsCollection.deleteOne(query)
//             res.send(result)
//         })
//         // Delete from Watch List
//         app.delete("/wishList/:id", async (req, res) => {
//             const id = req.params.id
//             const query = { _id: new ObjectId(id) }
//             const result = await wishListCollection.deleteOne(query)
//             res.send(result)
//         })


//         // Send a ping to confirm a successful connection
//         // todo Comment it before deployment.
//         // await client.db("admin").command({ ping: 1 });
//         console.log("Pinged your deployment. You successfully connected to MongoDB!");
//     } finally {
//         // Ensures that the client will close when you finish/error
//         // await client.close();
//     }
// }
// run().catch(console.dir);


// app.get("/", (req, res) => {
//     res.send("Assignment-11 server is running smoothly.......")
// })

// app.listen(port, () => {
//     console.log(`Assignment-11 server is running on Port: ${port}`)
// })


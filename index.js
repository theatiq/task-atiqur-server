const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB connection
// const uri = 'mongodb://localhost:27017';

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hnhnv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri);
let tasksCollection;

async function connectDB() {
  try {
    await client.connect();
    const db = client.db('taskDB'); // Use 'taskdb' database
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

require("dotenv").config()
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000

app.use(cors({
    origin: ['http://localhost:5173', 'https://atiqurstech.web.app', 'https://atiqurstech.firebaseapp.com'],
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())


const verifyToken = (req, res, next) => {
    const token = req.cookies?.token
    // console.log("token inside verify", token)
    if (!token) {
        return res.status(401).send({ message: "unauthorized access" })
    }
    jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: "unauthorized access" })
        }
        req.user = decoded
        req.email = decoded.email

        next()
    })
}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hnhnv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;



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
        const tasksCollection = client.db("taskDB").collection('tasks')


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



        app.post("/jwt", (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.TOKEN_SECRET, { expiresIn: '1y' })


            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            })
                .send({ success: true })
        })

        app.post("/logout", (req, res) => {
            res.clearCookie("token", {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            })
                .send({ success: true })
        })




        // Send a ping to confirm a successful connection
        // todo Comment it before deployment.
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("Assignment-11 server is running smoothly.......")
})

app.listen(port, () => {
    console.log(`Assignment-11 server is running on Port: ${port}`)
})


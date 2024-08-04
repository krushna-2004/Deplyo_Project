const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = "mongodb+srv://Twitter_admin:V3PgAK3sKNxMQWit@cluster0.zvdkhjm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


async function run() {
    try {
        await client.connect();
        const postCollection = client.db('database').collection('posts'); // This is post collection
        const userCollection = client.db('database').collection('user'); // This is user collection

        // Get posts
        app.get('/post', async (req, res) => {
            const post = (await postCollection.find().toArray()).reverse();
            res.send(post);
        });

        // Get users
        app.get('/user', async (req, res) => {
            const user = await userCollection.find().toArray();
            res.send(user);
        });

        app.get('/loggedInUser', async (req, res) => {
            const email = req.query.email;
            const user = await userCollection.find({ email: email }).toArray();
            res.send(user);
        });
          

        app.get('/userPost', async (req, res) => {
            const email = req.query.email;
            const post = (await userCollection.find({ email: email }).toArray()).reverse();
            res.send(post);
        });

        // Post a new post
        app.post('/post', async (req, res) => {
            const post = req.body;
            const result = await postCollection.insertOne(post);
            res.send(result);
        });

        // Register a new user
        app.post('/register', async (req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.send(result);
        });

        // app.patch('/userUpdates/:email', async (req, res) => {
        //     const filter = { email: req.params.email };
        //     const profile = req.body;
        //     const options = { upsert: true };
        //     const updateDoc = { $set: profile };
        //     const result = await userCollection.updateOne(filter, updateDoc, options);
        //     console.log(result); // Log the result to confirm the update
        //     res.send(result);
        // });

        app.patch('/userUpdates/:email', async (req, res) => {
            const email = req.params.email;
            const updatedData = req.body;
          
            try {
              const result = await userCollection.updateOne({ email: email }, { $set: updatedData });
              res.send(result);
            } catch (error) {
              res.status(500).send({ message: 'Error updating user data', error });
            }
          });
        

    } catch (error) {
        console.log(error);
    }
}
// In server.js


run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello from twitter!');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

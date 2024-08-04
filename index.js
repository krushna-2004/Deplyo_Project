const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');
const crypto = require('crypto');
const { MongoClient, ServerApiVersion } = require('mongodb');
const stripe = require('stripe')('sk_test_51PfnURAGudO2EfcdTaUQA5aG3FP6mD6YJRpd68KI29Tn9PlsgB8CghYqud5zto0GArwsNfgu1vkk0BrrcSPmeZlL00htDEfR2Z');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

const mongoUri = "mongodb+srv://Twitter_admin:V3PgAK3sKNxMQWit@cluster0.zvdkhjm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(mongoUri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

mongoose.connect(mongoUri);

const verificationSchema = new mongoose.Schema({
    email: String,
    deviceType: String,
    ipAddress: String,
    operatingSystem: String,
    browser: String,
    timestamp: { type: Date, default: Date.now },
});

const Verification = mongoose.model('Verification', verificationSchema);

let otpStore = {};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'shirsathkrushna2004@gmail.com',
        pass: 'uxky rmod pnke sbhr',
    },
    tls: {
        rejectUnauthorized: false,
    },
});

async function run() {
    try {
        await client.connect();
        const postCollection = client.db('database').collection('posts');
        const userCollection = client.db('database').collection('user');

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

        // Get logged-in user
        app.get('/loggedInUser', async (req, res) => {
            const email = req.query.email;
            const user = await userCollection.find({ email }).toArray();
            res.send(user);
        });

        // Get user posts
        app.get('/userPost', async (req, res) => {
            const email = req.query.email;
            const post = (await userCollection.find({ email }).toArray()).reverse();
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

        // Update user data
        app.patch('/userUpdates/:email', async (req, res) => {
            const email = req.params.email;
            const updatedData = req.body;
            try {
                const result = await userCollection.updateOne({ email }, { $set: updatedData });
                res.send(result);
            } catch (error) {
                res.status(500).send({ message: 'Error updating user data', error });
            }
        });

        // Endpoint to send OTP
        app.post('/send-otp', (req, res) => {
            const { email } = req.body;
            const otp = crypto.randomInt(100000, 999999).toString();
            otpStore[email] = otp;
            const mailOptions = {
                from: 'shirsathkrushna2004@gmail.com',
                to: email,
                subject: 'Your OTP Code',
                text: `Your OTP code is ${otp}`,
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return res.status(500).json({ error: 'Failed to send OTP', details: error.message });
                }
                res.status(200).json({ message: 'OTP sent successfully' });
            });
        });

        // Endpoint to verify OTP
        app.post('/verify-otp', (req, res) => {
            const { email, otp } = req.body;
            if (otpStore[email] === otp) {
                delete otpStore[email];
                res.status(200).json({ success: true, message: 'OTP verified successfully' });
            } else {
                res.status(400).json({ success: false, error: 'Invalid OTP' });
            }
        });

        // Endpoint to save verification data
        app.post('/save-info', async (req, res) => {
            const { email, deviceType, ipAddress, operatingSystem, browser } = req.body;
            const verification = new Verification({
                email,
                deviceType,
                ipAddress,
                operatingSystem,
                browser,
            });
            try {
                await verification.save();
                res.status(200).send('Verification data saved successfully');
            } catch (error) {
                res.status(500).send('Error saving verification data');
            }
        });

        // Endpoint to retrieve Stripe prices
        app.get('/prices', async (req, res) => {
            try {
                const prices = await stripe.prices.list({
                    expand: ['data.product'],
                });
                res.json(prices);
            } catch (error) {
                res.status(500).send({ error: error.message });
            }
        });

        // Endpoint to create a Stripe subscription
        app.post('/create-subscription', async (req, res) => {
            const { paymentMethodId, priceId } = req.body;
            try {
                const customer = await stripe.customers.create({
                    payment_method: paymentMethodId,
                    email: 'customer@example.com', // Replace with customer's email
                    invoice_settings: {
                        default_payment_method: paymentMethodId,
                    },
                });
                const subscription = await stripe.subscriptions.create({
                    customer: customer.id,
                    items: [{ price: priceId }],
                    expand: ['latest_invoice.payment_intent'],
                });
                res.send(subscription);
            } catch (error) {
                res.status(400).send({ error: { message: error.message } });
            }
        });

    } catch (error) {
        console.log(error);
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello from Twitter!');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

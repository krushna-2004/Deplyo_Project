const express = require('express');
const stripe = require('stripe')('sk_test_51PfnURAGudO2EfcdTaUQA5aG3FP6mD6YJRpd68KI29Tn9PlsgB8CghYqud5zto0GArwsNfgu1vkk0BrrcSPmeZlL00htDEfR2Z');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

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

app.listen(4242, () => console.log('Server is running on port 4242'));

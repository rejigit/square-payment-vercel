const { Client, Environment } = require('square');
const express = require('express');
const cors = require('cors');

module.exports = async (req, res) => { // Vercel uses module.exports for serverless functions
  const app = express();

  // Replace with your actual access token and environment
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;  // Get from Vercel environment variables
  const environment = Environment.Sandbox; // Or Environment.Production

  if (!accessToken) {
    console.error('SQUARE_ACCESS_TOKEN environment variable not set!');
    return res.status(500).json({ success: false, message: 'Server configuration error.' });
  }

  const client = new Client({
    environment: environment,
    accessToken: accessToken
  });

  app.use(express.json());
  app.use(cors()); // Enable CORS for local development (remove/configure for production)

  if (req.method === 'POST') {
    if (req.url === '/api/process-payment') {
      const { nonce, name, email } = req.body;

      try {
        const paymentsApi = client.paymentsApi;

        const requestBody = {
          sourceId: nonce,
          amountMoney: {
            amount: 100, // Example: $1.00 (in cents) - Dynamically set this amount
            currency: 'USD'
          },
          idempotencyKey: require('crypto').randomBytes(22).toString('hex'), // Unique key to prevent duplicate charges
          customerId: null, // Consider storing customer IDs for recurring payments

          // Add customer data to payment request.
          billingAddress: {
            familyName: name.split(' ')[1],
            givenName: name.split(' ')[0],
            emailAddress: email,
          }
        };

        const { result } = await paymentsApi.createPayment(requestBody);

        console.log(result);

        res.json({ success: true, message: 'Payment successful!' });

      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Payment failed.', errors: error.errors }); // Send back Square API errors
      }
    } else {
        res.status(404).json({success: false, message: 'Endpoint not found'})
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed.' });
  }
}

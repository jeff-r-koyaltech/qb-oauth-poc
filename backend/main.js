import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import {
  authorizeUri,
  disconnectUri,
  getToken,
  onAuthorizeCB,
  proxyApiCall,
  // refreshToken,
} from './qb-oauth.js';

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.get('/api/quickbooks/authorize-uri', authorizeUri);
app.get('/api/quickbooks/authorize-uri-cb', onAuthorizeCB);
app.get('/api/quickbooks/token', getToken);
// app.get('/api/quickbooks/refresh-token', refreshToken);
app.post('/api/quickbooks/proxy', proxyApiCall);
app.get('/api/quickbooks/disconnect-uri', disconnectUri);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

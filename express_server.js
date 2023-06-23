/* eslint-disable no-console */
const express = require('express');

const app = express();
const PORT = 8080; // default port 8080

const urlDatabase = {
  b2xVn2: 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com',
};

// Root path handler
app.get('/', (req, res) => {
  res.send('Hello!');
});

// Endpoint to return urlDatabase as JSON
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

// Endpoint to send HTML response
app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

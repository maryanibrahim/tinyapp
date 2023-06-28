/* eslint-disable no-plusplus */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
const express = require('express');

const app = express();
const PORT = 8080;

// Function to generate a random string
function generateRandomString() {
  const length = 6;
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
}

// Set EJS as the view engine
app.set('view engine', 'ejs');

const urlDatabase = {
  b2xVn2: 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com',
};

// Middleware to parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

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
// dummy response
app.post('/urls', (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  res.send('Ok'); // Respond with 'Ok' (we will replace this)
});

// Add GET route for creating a new URL
app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

// Add POST route for updating a URL
app.post('/urls/:id', (req, res) => {
  const { longURL } = req.body;
  const { id } = req.params;
  if (urlDatabase[id]) {
    urlDatabase[id].longURL = longURL;
    res.redirect('/urls');
  } else {
    res.status(403).send('Not permitted');
  }
});

// Add POST route for creating a new URL
app.post('/urls', (req, res) => {
  const { longURL } = req.body;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL };
  res.redirect(`/urls/${shortURL}`);
});

// Add POST route for deleting a URL
app.post('/urls/:shortURL/delete', (req, res) => {
  const { shortURL } = req.params;
  if (urlDatabase[shortURL]) {
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else {
    res.status(403).send('Not permitted');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

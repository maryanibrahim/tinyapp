/* eslint-disable no-shadow */
/* eslint-disable no-undef */
/* eslint-disable no-console */
/* eslint-disable no-plusplus */
/* eslint-disable no-unused-vars */
/* eslint-disable import/no-extraneous-dependencies */

const express = require('express');
const session = require('express-session');

const app = express();
const PORT = 8080; // default port 8080

function generateRandomString() {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomString = '';

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters[randomIndex];
  }

  return randomString;
}

app.set('view engine', 'ejs');
const urlDatabase = {
  b2xVn2: 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com',
};

app.use(express.urlencoded({ extended: true }));

// Session handling middleware
app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
  }),
);

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});
app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});
app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});
app.get('/urls/:id', (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];

  if (longURL) {
    const templateVars = {
      shortURL, longURL, id: shortURL, url: { id: shortURL, longURL },
    };
    res.render('urls_show', templateVars);
  } else {
    res.status(404).send('Short URL not found');
  }
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});
app.post('/urls/:id', (req, res) => {
  const { id } = req.params;
  const newLongURL = req.body.longURL;

  // Find the URL with the matching ID in your in-memory object
  const url = urlDatabase[id];
  if (url) {
    // Update the longURL value
    urlDatabase[id] = newLongURL;
    res.redirect('/urls');
  } else {
    res.status(404).send('URL not found');
  }
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const { shortURL } = req.params;
  const { userID } = req.session;

  if (userID && urlDatabase[shortURL] && urlDatabase[shortURL].userID === userID) {
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else {
    res.status(403).send('Not permitted');
  }
});
// login
app.post('/login', (req, res) => {
  const { username } = req.body;
  res.cookie('username', username);
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const app = express();
const PORT = 8080;

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
app.use(cookieParser());

// Session handling middleware
app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
  }),
);

// Define the users object
const users = {
  userRandomID: {
    id: 'userRandomID',
    email: 'user@example.com',
    password: 'purple-monkey-dinosaur',
  },
  user2RandomID: {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: 'dishwasher-funk',
  },
};

// Helper function to find a user by email
const getUserByEmail = (email) => {
  const userIds = Object.keys(users);
  const foundUser = userIds.find((userId) => users[userId].email === email);
  return foundUser ? users[foundUser] : null;
};
//get
// Login form
app.get('/login', (req, res) => {
  res.render('login');
});

// Register form
app.get('/register', (req, res) => {
  res.render('register');
});

// Main page showing URLs
app.get('/urls', (req, res) => {
  const templateVars = {
    user: users[req.session.user_id], // Access the user object based on the 'user_id' session property
    urls: urlDatabase,
  };
  res.render('urls_index', templateVars);
});

// Create new URL page
app.get('/urls/new', (req, res) => {
  const templateVars = {
    user: users[req.session.user_id], // Pass the user object based on the 'user_id' session property
  };
  res.render('urls_new', templateVars);
});

// Show individual URL page
app.get('/urls/:id', (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];

  if (longURL) {
    const templateVars = {
      user: users[req.session.user_id], // Pass the user object based on the 'user_id' session property
      shortURL,
      longURL,
      id: shortURL,
      url: { id: shortURL, longURL },
    };
    res.render('urls_show', templateVars);
  } else {
    res.status(404).send('Short URL not found');
  }
});
//post
// Login route
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Look up the user by email
  const user = getUserByEmail(email);

  // Check if user exists and password matches
  if (!user || user.password !== password) {
    res.status(403).send('Invalid email or password');
    return;
  }

  // Set the user_id session property with the user's ID
  req.session.user_id = user.id;

  // Redirect to /urls
  res.redirect('/urls');
});

// Logout route
app.post('/logout', (req, res) => {
  // Clear the user_id session property
  req.session.user_id = null;

  // Redirect to /login
  res.redirect('/login');
});

// POST /register endpoint
app.post('/register', (req, res) => {
  const { email, password } = req.body;

  // Check if the email or password is empty
  if (!email || !password) {
    res.status(400).send('Email and password fields cannot be empty');
    return;
  }

  // Check if the email is already registered
  const existingUser = getUserByEmail(email);
  if (existingUser) {
    res.status(400).send('Email is already registered');
    return;
  }

  // Generate a random user ID
  const userId = generateRandomString();

  // Create a new user object
  const newUser = {
    id: userId,
    email: email,
    password: password,
  };

  // Add the new user to the users object
  users[userId] = newUser;

  // Set the user_id session property
  req.session.user_id = userId;

  // Redirect the user to the /urls page
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
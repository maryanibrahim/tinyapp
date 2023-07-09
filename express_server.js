// express
const express = require('express');
const app = express();

// port
const PORT = 8080;

// bcryptjs
const bcryptjs = require('bcryptjs');
const saltRounds = 10;

// helpers
const {
  generateRandomString,
  findEmail,
  urlsForUser,
  getUserByEmail
} = require("./helpers");

// ejs
app.set("view engine", "ejs");

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// cookieSession
const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['7f69fa85-caec-4d9c-acd7-eebdccb368d5', 'f13b4d38-41c4-46d3-9ef6-8836d03cd8eb']
}));

// database
const urlDatabase = {
  b2xVn2: { longURL: 'http://www.lighthouselabs.ca' },
  '9sm5xK': { longURL: 'http://www.google.com' }
};

// user database
const users = {
  "abcd": {
    id: "abcd",
    email: "m@yahoo.com",
    password: bcryptjs.hashSync("2", saltRounds)
  },
};

// Login page
app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session.userID]
  };
  res.render("urls_login", templateVars);
});

// Register page
app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session.userID]
  };
  res.render("urls_register", templateVars);
});

// Main page showing URLs
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlsForUser(req.session.userID, urlDatabase),
    user: users[req.session.userID]
  };
  res.render("urls_index", templateVars);
});

// Redirect to the long URL associated with the given shortURL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const urlEntry = urlDatabase[shortURL];

  if (urlEntry && urlEntry.longURL) {
    res.redirect(urlEntry.longURL);
  } else {
    res.status(404).send("404 Error: This Short URL doesn't exist");
  }
});

// Create a new URL page
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.session.userID]
  };
  if (!req.session.userID) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

// Edit/Show Tiny URL page
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL] ? urlDatabase[shortURL].longURL : null;
  
  if (!req.session.userID) {
    res.status(400).send("400 Error: Please Login or Register");
  } else if (!urlDatabase[shortURL]) {
    res.status(404).send("404 Error: This URL doesn't exist");
  } else if (urlDatabase[shortURL].userID !== req.session.userID) {
    res.status(403).send("403 Error: This is not your URL");
  } else {
    const templateVars = {
      shortURL: shortURL,
      longURL: longURL,
      user: users[req.session.userID]
    };
    res.render("urls_show", templateVars);
  }
});

// Register new user
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (email === "" || password === "") {
    res.status(400).send("400 Error: Please Provide Information");
  } else if (findEmail(email, users)) {
    res.status(400).send("400 Error: Email already registered");
  } else if (password.length < 8) {
    res.status(400).send("400 Error: Password should be at least 8 characters long");
  } else if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/)) {
    res.status(400).send("400 Error: Password should contain at least one lowercase letter, one uppercase letter, and one digit");
  } else {
    const newUserID = generateRandomString();
    const hashedPassword = bcryptjs.hashSync(password, 10);

    const userObj = {
      id: newUserID,
      email: email,
      password: hashedPassword
    };

    users[newUserID] = userObj;
    req.session.userID = newUserID;
    res.redirect("/urls");
  }
});

// Edit a URL
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = req.body.longURL;

  if (urlDatabase[shortURL]) {
    if (urlDatabase[shortURL].userID === req.session.userID) {
      urlDatabase[shortURL].longURL = longURL;
      res.redirect("/urls");
    } else {
      res.status(403).send("403 Forbidden: Not permitted");
    }
  } else {
    res.status(404).send("404 Not Found: This URL doesn't exist");
  }
});

// Create a new URL
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const userID = req.session.userID;
  
  if (longURL === "") {
    res.status(400).send("400 Error: Please provide a valid URL");
  } else {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = { longURL, userID };
    res.redirect(`/urls/${shortURL}`);
  }
});

// Delete a URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL] && urlDatabase[shortURL].userID === req.session.userID) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  } else {
    res.status(403).send("403 Forbidden: Not permitted");
  }
});

// Authentication process
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users);

  if (user) {
    if (bcryptjs.compareSync(password, user.password)) {
      // Password is correct
      req.session.userID = user.id;
      res.redirect("/urls");
    } else {
      // Wrong password
      res.status(403).send("403 Error: Wrong Password");
    }
  } else {
    // Email not found
    res.status(403).send("403 Error: Please Register");
  }
});

// User logout
app.post("/logout", (req, res) => {
  req.session.userID = null;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});

const express = require('express');
const app = express();
const PORT = 8080;
const bcrypt = require('bcrypt');
const saltRounds = 10;
const cookieSession = require('cookie-session');


const {
  generateRandomString,
  findEmail,
  urlsForUser,
  getUserByEmail
} = require("./helpers");

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['7f69fa85-caec-4d9c-acd7-eebdccb368d5', 'f13b4d38-41c4-46d3-9ef6-8836d03cd8eb']
}));

const urlDatabase = {
  b2xVn2: { longURL: 'http://www.lighthouselabs.ca' },
  '9sm5xK': { longURL: 'http://www.google.com' }
};

const users = {
  "abcd": {
    id: "abcd",
    email: "m@yahoo.com",
    password: bcrypt.hashSync("2", saltRounds)
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
  const userEmail = findEmail(email, users);

  if (email === "" || password === "") {
    res.status(400).send("400 Error: Please Provide Information");
  } else if (userEmail) {
    res.status(400).send("400 Error: Email already registered");
  } else {
    const newUserID = generateRandomString();
    const userObj = {
      id: newUserID,
      email: email,
      password: bcrypt.hashSync(password, saltRounds)
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
    if (bcrypt.compareSync(password, user.password)) {
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

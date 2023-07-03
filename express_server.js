//express
const express = require("express");
const app = express();

//port
const PORT = 8080;

//ejs
app.set("view engine", "ejs");

//body parser
const bodyParser = require("body-parser");
// Parse incoming requests with JSON payloads
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// password hasher
const bcrypt = require('bcrypt');
const saltRounds = 10;

// helper functions
const { generateRandomString, findEmail, findPassword, findUserID, urlsForUser } = require("./helpers");

//cookie-session
const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['7f69fa85-caec-4d9c-acd7-eebdccb368d5', 'f13b4d38-41c4-46d3-9ef6-8836d03cd8eb']
}));


// newdatabase with id
const urlDatabase = {
  b2xVn2: 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com',
};
// user database
const users = {
  "abcd": {
    id: "abcd",
    email: "m@yahoo.com",
    password: bcrypt.hashSync("2", saltRounds)
  },
};

//GET

//login form
app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session["userID"]]
  };
  res.render("urls_login", templateVars);
});

//register form
app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session["userID"]]
  };
  res.render("urls_register", templateVars);
});

//main page
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlsForUser(req.session.userID, urlDatabase),
    user: users[req.session["userID"]]
  };
  res.render("urls_index", templateVars);
});


app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

//new URLS
app.get("/urls/new", (req, res) => {
  // user should not see this page if not logged in
  const templateVars = {
    user: users[req.session["userID"]]
  };
  if (!req.session.userID) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

//edit / show tiny url
app.get("/urls/:shortURL", (req, res) => {
  if (!req.session["userID"]) {
    res.status(400).send("400 error ! Please Login or Register");
  } else if (!urlDatabase[req.params.shortURL]) {
    res.status(404).send("404 not found! This URL doesn't exist");
  } else if (urlDatabase[req.params.shortURL].userID === req.session["userID"]) {
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user: users[req.session["userID"]]
    };
    res.render("urls_show", templateVars);
  } else if (urlDatabase[req.params.shortURL].userID !== req.session["userID"]) {
    res.status(403).send("403 error ! This is not your URL");
  } else {
    res.status(400).send("400 error ! Please Login");
  }
});


//POST

// generate new id and store register
app.post("/register", (req, res) => {
  const newUserID = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const userObj = {
    id: newUserID,
    email: email,
    password: bcrypt.hashSync(password, saltRounds)
  };
  const userEmail = findEmail(email, users);
  if (userObj.email === "" || userObj.password === "") {
    res.status(400).send("400 error ! Please Provide Information");
  } else if (!userEmail) {
    users[newUserID] = userObj;
    req.session["userID"] = newUserID;
    res.redirect("/urls");
  } else {
    res.status(400).send("400 error ! Please Login");
  }
});


// edit urls
app.post("/urls/:id", (req, res) => {
  if (urlDatabase[req.params.id].userID === req.session["userID"]) {
    let longURL = req.body.longURL;
    urlDatabase[req.params.id].longURL = longURL;
    res.redirect('/urls');
  } else {
    res.status(403).send("Not permitted");
  }
});

//generate random shurt url + add to database
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const userID = req.session["userID"];
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL, userID };
  res.redirect(`/urls/${shortURL}`);
});

// delete url
app.post("/urls/:shortURL/delete", (req, res) => {
  console.log(urlDatabase[req.params.shortURL].userID);
  if (urlDatabase[req.params.shortURL].userID === req.session["userID"]) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(403).send("Not permitted");
  }
});

//Authentification process
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userEmail = findEmail(email, users);
  const userPassword = findPassword(email, users);
  if (email === userEmail) {
    if (bcrypt.compareSync(password, userPassword)) {
      const userID = findUserID(email, users);
      // set cookie with user id
      req.session["userID"] = userID;
      res.redirect("/urls");
    } else {
      res.status(403).send("403 Forbidden: Wrong Password");
    }
  } else {
    res.status(403).send("403 Forbidden : Please Register");
  }
});

//logout
app.post("/logout", (req, res) => {
  req.session["userID"] = null;
  res.redirect("/urls");
});


app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
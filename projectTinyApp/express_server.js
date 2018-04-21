var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080;

//EJS automatically knows to look inside the views directory for template files
//views subdir created manually
app.set("view engine", "ejs");

// for POST
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser());
const bcrypt = require('bcrypt');
// var cookieSession = require('cookie-session');
// session = require('express-session');
// app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 }}));
// app.set('trust proxy', 1);




var urlDatabase = {
  "b2xVn2": {
    id: "userRandomID",
    shortURL: "b2xVn2",
    url: "http://www.lighthouselabs.ca"
  },
  "9sm5xK": {
    id: "userRandomID",
    shortURL: "9sm5xK",
    url: "http://www.google.com"
  },
  "AAAaaa": {
    id: "user2RandomID",
    shortURL: "AAAaaa",
    url: "http://www.yahoo.com"
  },
  "BBBbbb": {
    id: "userRandomID",
    shortURL: "BBBbbb",
    url: "http://www.bbc.com"
  },
  "cccCCC": {
    id: "user2RandomID",
    shortURL: "cccCCC",
    url: "http://www.cnn.com"
  },
};


const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "$2a$10$cY4ZoerABjOpvizZl43/sOLzF9CVkK6Pe4oftnoVOmeQnQGBf.6uC"//purple-monkey-dinosaur
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "$2a$10$QlkTccpIlXZhKNHcjREJnOX.zK47k/LIegip9asOADpg8XE3A.VSC" //dishwasher-funk
  }
};


function generateRandomString(length) {
  const str = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const len = length;

  let res = '';
  for(var i = 0; i < len; i++){
    res += str.charAt(Math.floor(Math.random() * str.length));
  }
  return res;
}


function addToDB(shortKey, longUrl, userId) {
  for (var key in urlDatabase.user.url){
    urlDatabase.user.url.id = userId;
    urlDatabase.user.url[shortKey] = longUrl;
  }
}



function findURL(inputUrl, userId) {
  for (var key in urlDatabase.user.url){
    if (urlDatabase.user.url[key] === inputUrl) {
      return key;
    } else {
      let newKey = generateRandomString(6);
      addToDB(newKey, inputUrl, userId);
      return newKey;
    }
  }
}

function updateURLs(xKey, yURL) {
  for (var key in urlDatabase){
    if (key === xKey) {
      urlDatabase[key].url = yURL;
    }
  }
}

function checkExistingUser(userEmail){
  for (const userId in users) {
      if ( users[userId].email === userEmail ) {
        return true;
      }
  }
}

function getUserInfo(userId){
  let userDetail = {};
  for (const user in users) {
    if (user === userId) {
      userDetail = {
        id: users[user].id,
        email: users[user].email,
        password: users[user].password
      }
    }
  }
  return userDetail;
}

function checkLogin(userEmail, userPwd){
  let id = '';
  for (const userId in users) {
    if ( users[userId].email === userEmail && bcrypt.compareSync(userPwd, users[userId].password)) {
      id = userId;
    }
  }
  return id;
}

function urlsForUser(id) {
  for (let key in urlDatabase){
    if (urlDatabase[key].id !== id) {
      delete urlDatabase[key];
    }
  }
  return urlDatabase;
}

function checkId(userId, pageId){
  let x = false;
  for (let key in urlDatabase){
    if (key === pageId){
      if(urlDatabase[key].id ===  userId) {
        x = true;
      }
    }
  }
  return x;
}

// pass url data to the template
app.get("/urls", (req, res) => {
  // cookies
  let userInfo = getUserInfo(req.cookies['user_id']);
  //let userInfo = req.session.user_id;

  if(Object.keys(userInfo).length === 0) {
    userInfo.id = 1;
  } else {
    urlDatabase = urlsForUser(userInfo['id']);
  }
  userInfo.urls = urlDatabase;
  res.render("urls_index", userInfo);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  let userInfo = getUserInfo(req.cookies['user_id']);
  //let userInfo = getUserInfo(req.session.user_id);

  if(!userInfo.id) {
    userInfo.id = false;
    res.redirect(302, '/login');
  } else {
    userInfo.urls = urlDatabase.user;
    res.render("urls_new", userInfo);
  }
});

app.get("/urls/:id", (req, res) => {
  let userInfo = getUserInfo(req.cookies['user_id']);
  //let userInfo = getUserInfo(req.session.user_id);
  let errorMsg = '';

  if(!userInfo.id || userInfo.id === 1) {
    userInfo.id = false;
    errorMsg = 'Please login in first';
    res.send(errorMsg);
    //res.redirect(302, '/login');
  }
  short = req.params.id;
  const returnedPage = checkId(userInfo.id, short);
  if(!returnedPage) {
    errorMsg = 'You can edit only links you created.';
    res.send(errorMsg);
  } else {
    short = req.params.id;

    userInfo.shortURL = short;
    userInfo.longURL = urlDatabase[short];
    res.render("urls_show", userInfo)
  }
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(302, longURL);
});

// reg
app.get("/register", (req, res) => {
  let userInfo = getUserInfo(req.cookies['user_id']);
  //let userInfo = getUserInfo(req.session.user_id);console.log(req.session.user_id);
  if(!userInfo.id) {
    userInfo.id = false;
    res.render('register', userInfo);
  } else {
    userInfo.urls = urlDatabase;
    res.render("urls_index", userInfo);
  }
});

// login
app.get("/login", (req, res) => {
  let userInfo = getUserInfo(req.cookies['user_id']);
  //let userInfo = getUserInfo(req.session.user_id);
  if(!userInfo.id) {
    userInfo.id = false;
    res.render('login', userInfo);
  } else {
    userInfo.urls = urlDatabase;
    res.render("login", userInfo);
  }
});


// add the handler on the root path /
app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.post('/logout', (req, res) => {
  const user = req.body.user_id;
  res.clearCookie('user_id', user);
  res.redirect(302, '/login');
});

// registration
app.post("/register", (req, res) => {
  const newUserId = generateRandomString(6);
  const newUserEmail = req.body.email;
  const newUserPwd = req.body.password;

  const hashedPassword = bcrypt.hashSync(newUserPwd, 10);

  let existingUser = checkExistingUser(newUserEmail);
  if (!newUserEmail || !newUserPwd) {
    res.status(400);
    res.send('Please enter both fields.');
  } else if (existingUser){
    res.send('Your email is already exist.');
  } else {

    users[newUserId] = {id: newUserId, email: newUserEmail, password: hashedPassword};
    res.cookie('user_id', newUserId);
    res.redirect('/urls');
  }
});

// login
app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPwd = req.body.password;
  let errorMsg = '';
  let id = checkLogin(userEmail, userPwd);
  if (!userEmail || !userPwd) {
    res.status(403);
    errorMsg = 'Please enter both fields.';
    res.send(errorMsg);
    //res.render('login', errorMsg);
  } else if (!id){
    res.status(403);
    errorMsg = 'Your email address or password does\'t match.';
    res.send(errorMsg);
    //res.render("login", errorMsg);
    //res.render('error', { error: errorMsg });
  } else {
    res.cookie('user_id', id);
    res.redirect('/');
  }
});

// newly entered url
app.post("/urls", (req, res) => {
  const userId = req.cookies['user_id'];
  const longURL = req.body.longURL;
  const shortURL = findURL(longURL, userId);
  res.redirect(`/urls/${shortURL}`);
});

app.post('/urls/:id/delete', (req, res) => {
  for (var key in urlDatabase) {
    if(key === req.params.id) {
      delete urlDatabase[key];
    }
  }
  res.redirect('/urls');
});

app.post('/urls/:id', (req, res) => {
  let updateURL = req.body.formUpdate;
  let updateKey = req.params.id;
  updateURLs(updateKey, updateURL);
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});



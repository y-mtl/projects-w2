var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const bcrypt = require('bcrypt');

var cookieSession = require('cookie-session');
//session = require('express-session');
app.use(cookieSession({
  name: 'session',
  keys: ['lets-encrypt-it'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));


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
    email: "user@example.com",//purple-monkey-dinosaur
    password: "$2a$10$cY4ZoerABjOpvizZl43/sOLzF9CVkK6Pe4oftnoVOmeQnQGBf.6uC"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",//dishwasher-funk
    password: "$2a$10$QlkTccpIlXZhKNHcjREJnOX.zK47k/LIegip9asOADpg8XE3A.VSC"
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
  if(!userId) {
    userDetail = {
      id: 1
    }
  } else {
    for (const user in users) {
      if (user === userId) {
        userDetail = {
          id: users[user].id,
          email: users[user].email,
          password: users[user].password
        }
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
  let tempList = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].id === id) {
      tempList[urlDatabase[key].shortURL] = {
        ['id']:  urlDatabase[key].id,
        ['shortURL']: urlDatabase[key].shortURL,
        ['url']:  urlDatabase[key].url
      }
    }
  }
  return tempList;
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



function addNewlyToDB(inputUrl, userId) {
  const shortKey = generateRandomString(6);
  let result = true;
  for (var key in urlDatabase){
    if (urlDatabase[key].url === inputUrl) {
      result = false;
    } else {
      urlDatabase[shortKey] = {
        "id": userId,
        "shortURL": shortKey,
        "url": inputUrl
      }
      result = true;
    }
  }
  return result;
}

function addNewURL(uid, newUrl){
  const randomStr = generateRandomString(6);
  urlDatabase[randomStr] = {
    id: uid,
    shortURL: randomStr,
    url: newUrl
  }
}



app.get("/", (req, res) => {
  if(!req.session.user_id) {
    res.redirect(302, '/login');
  } else {
    req.session.user_id = req.session.user_id
    res.redirect(302, '/urls');
  }
});

// page to show list of urls
app.get("/urls", (req, res) => {
  let userInfo = getUserInfo(req.session.user_id);
  const enduserFrontList = urlsForUser(userInfo['id']);
  userInfo.urls = enduserFrontList;
  res.render("urls_index", userInfo);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  let userInfo = getUserInfo(req.session.user_id);
  if(!userInfo.id || userInfo.id === 1) {
    userInfo.id = false;
    res.redirect(302, '/login');
  } else {
    userInfo.urls = urlDatabase.user;
    res.render("urls_new", userInfo);
  }
});

app.get("/urls/:id", (req, res) => {
  let userInfo = getUserInfo(req.session.user_id);
  let errorMsg = '';
  if(!userInfo.id || userInfo.id === 1) {
  res.render("urls_index", userInfo);
  }
  short = req.params.id;

  const returnedPage = checkId(userInfo.id, short);
  if(!returnedPage) {
    errorMsg = 'You can edit only links you created.';
    userInfo.errorMsg = errorMsg;
    res.render("error", userInfo);
  } else {
    short = req.params.id;
    userInfo.shortURL = short;
    userInfo.urls = urlDatabase[short];
    res.render("urls_show", userInfo)
  }
});

app.get("/u/:id", (req, res) => {
  if(urlDatabase[req.params.id]) {
    const longURL = urlDatabase[req.params.id].url;
    res.redirect(longURL);
  } else {
    let userInfo = getUserInfo(req.session.user_id);
    let errorMsg = "The URL doesn't exist!";
    userInfo.errorMsg = errorMsg;
    res.render("error", userInfo);
  }
});

// reg
app.get("/register", (req, res) => {
  //let userInfo = getUserInfo(req.cookies['user_id']);
  let userInfo = getUserInfo(req.session.user_id);
  if(!userInfo.id || userInfo.id === 1) {
    userInfo.id = 1;
    res.render('register', userInfo);
  } else {
    userInfo.urls = urlDatabase;
    res.redirect(302, "/urls");
  }
});

// login
app.get("/login", (req, res) => {
  let userInfo = getUserInfo(req.session.user_id);
  if(!userInfo.id || userInfo.id === 1) {
    res.render('login', userInfo);
  } else {
    userInfo.urls = urlDatabase;
    res.redirect(302, "/urls");
  }
});

app.post('/logout', (req, res) => {
  const user = req.body.user_id;
  req.session = null;
  res.redirect(302, '/urls');
});


// registration
app.post("/register", (req, res) => {
  const newUserId = generateRandomString(6);
  const newUserEmail = req.body.email;
  const newUserPwd = req.body.password;
  const hashedPassword = bcrypt.hashSync(newUserPwd, 10);
  let existingUser = checkExistingUser(newUserEmail);
  let userInfo = {};

  if (!newUserEmail || !newUserPwd) {
    errorMsg = 'Please enter both fields!';
    userInfo.id = 1;
    userInfo.errorMsg = errorMsg;
    res.status(400);
    res.render("error", userInfo);
  } else if (existingUser){
    errorMsg = 'Your email already exists!';
    userInfo.id = 1;
    userInfo.errorMsg = errorMsg;
    res.status(400);
    res.render("error", userInfo);
  } else {
    users[newUserId] = {id: newUserId, email: newUserEmail, password: hashedPassword};
    req.session.user_id = newUserId;
    res.redirect(302, '/urls');
  }
});

// login
app.post("/login", (req, res) => {
  let userInfo = {};
  const userEmail = req.body.email;
  const userPwd = req.body.password;
  let errorMsg = '';
  let id = checkLogin(userEmail, userPwd);
  if (!userEmail || !userPwd) {
    userInfo.id = 1;
    errorMsg = 'Please enter both fields.';
    //res.send(errorMsg);
    userInfo.errorMsg = errorMsg;
    res.status(403);
    res.render("error", userInfo);
    //res.render('login', errorMsg);
  } else if (!id || id === 1){
    errorMsg = 'Your email address or password does\'t match.';
    userInfo.id = 1;
    userInfo.errorMsg = errorMsg;
    res.status(403);
    res.render("error", userInfo);
  } else {
    //res.cookie('user_id', id);
    req.session.user_id = id;
    res.redirect(302, '/urls');
  }
});



// app.post("/urls", (req, res) => {
//   const userId = req.session.user_id;
//   const longURL = req.body.longURL;
//   const shortURL = findURL(longURL, userId);
//   res.redirect(`/urls/${shortURL}`);
// });

app.post("/urls", (req, res) => {
  const userId = req.session.user_id;
  const longURL = req.body.longURL;
  let db_result = addNewlyToDB(longURL, userId);
  if (!db_result) {
    send('The URL is already exist in your list.');
  } else {
    res.redirect(302, '/urls');
  }

});

// update link
app.post('/urls/:id', (req, res) => {
  let userInfo = getUserInfo(req.session.user_id);
  if(!userInfo.id || userInfo.id === 1){
    userInfo.id = 1;
    res.render("urls_index", userInfo);
  } else {
    let updateURL = req.body.formUpdate;
    let updateKey = req.params.id;
    updateURLs(updateKey, updateURL);
    res.redirect(302, '/urls');
  }
});

app.post('/urls/:id/delete', (req, res) => {
  let userInfo = getUserInfo(req.session.user_id);
  if(!userInfo.id || userInfo.id === 1){
    userInfo.id = 1;
    res.render("urls_index", userInfo);
  } else {
    for (var key in urlDatabase) {
      if(key === req.params.id) {
        delete urlDatabase[key];
      }
    }
    res.redirect(302,'/urls');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});



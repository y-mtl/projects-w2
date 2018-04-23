var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080;
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const bcrypt = require("bcrypt");

var cookieSession = require("cookie-session");
app.use(cookieSession({
  name: "session",
  keys: ["lets-encrypt-it"],
  maxAge: 24 * 60 * 60 * 1000
}));

// db - urls (temp)
var urlDatabase = {
  "b2xVn2": {
    id: "user1ID",
    shortURL: "b2xVn2",
    url: "http://www.lighthouselabs.ca"
  },
  "9sm5xK": {
    id: "user1ID",
    shortURL: "9sm5xK",
    url: "http://www.google.com"
  },
  "AAAaaa": {
    id: "user2ID",
    shortURL: "AAAaaa",
    url: "http://www.yahoo.com"
  },
  "BBBbbb": {
    id: "user1ID",
    shortURL: "BBBbbb",
    url: "http://www.bbc.com"
  },
  "cccCCC": {
    id: "user2ID",
    shortURL: "cccCCC",
    url: "http://www.cnn.com"
  },
};

// db - user (temp)
// sample user1 -- user@example.com | pwd: purple-monkey-dinosaur
// sample user2 -- user2@example.com | pwd: dishwasher-funk
// New user id will be randomly generated.
const users = {
  "user1ID": {
    id: "user1ID",
    email: "user@example.com",
    password: "$2a$10$cY4ZoerABjOpvizZl43/sOLzF9CVkK6Pe4oftnoVOmeQnQGBf.6uC"
  },
 "user2ID": {
    id: "user2ID",
    email: "user2@example.com",
    password: "$2a$10$QlkTccpIlXZhKNHcjREJnOX.zK47k/LIegip9asOADpg8XE3A.VSC"
  }
};

// ramdom num generator
function generateRandomString(length) {
  const str = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const len = length;
  let res = "";
  for(var i = 0; i < len; i++){
    res += str.charAt(Math.floor(Math.random() * str.length));
  }
  return res;
}

// DB related
function addToDB(shortKey, longUrl, userId) {
  for (var key in urlDatabase.user.url){
    urlDatabase.user.url.id = userId;
    urlDatabase.user.url[shortKey] = longUrl;
  }
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

// URL related
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

function urlsForUser(id) {
  let tempList = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].id === id) {
      tempList[urlDatabase[key].shortURL] = {
        ["id"]:  urlDatabase[key].id,
        ["shortURL"]: urlDatabase[key].shortURL,
        ["url"]:  urlDatabase[key].url
      }
    }
  }
  return tempList;
}

function addNewURL(uid, newUrl){
  const randomStr = generateRandomString(6);
  urlDatabase[randomStr] = {
    id: uid,
    shortURL: randomStr,
    url: newUrl
  }
}

// USER related
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
  let id = "";
  for (const userId in users) {
    if ( users[userId].email === userEmail && bcrypt.compareSync(userPwd, users[userId].password)) {
      id = userId;
    }
  }
  return id;
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


// ================== GET ==================== //
// * added error.ejs to handle some error msg.
// To make it work properly for the error page, added user id as "1" for not-logged-in user when necessary.

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/", (req, res) => {
  if(!req.session.user_id) {
    res.redirect(302, "/login");
  } else {
    req.session.user_id = req.session.user_id
    res.redirect(302, "/urls");
  }
});

app.get("/urls", (req, res) => {
  let userInfo = getUserInfo(req.session.user_id);
  const enduserFrontList = urlsForUser(userInfo["id"]);

  userInfo.urls = enduserFrontList;
  res.render("urls_index", userInfo);
});

app.get("/urls/new", (req, res) => {
  let userInfo = getUserInfo(req.session.user_id);
  if(!userInfo.id || userInfo.id === 1) {
    userInfo.id = false;
    res.redirect(302, "/login");
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
  let userInfo = getUserInfo(req.session.user_id);

  if(!userInfo.id || userInfo.id === 1) {
    userInfo.id = 1;
    res.render("register", userInfo);
  } else {
    userInfo.urls = urlDatabase;
    res.redirect(302, "/urls");
  }
});

// login
app.get("/login", (req, res) => {
  let userInfo = getUserInfo(req.session.user_id);

  if(!userInfo.id || userInfo.id === 1) {
    res.render("login", userInfo);
  } else {
    userInfo.urls = urlDatabase;
    res.redirect(302, "/urls");
  }
});

// ================ end of GET ================ //

// ================== POST ==================== //

// singup
app.post("/register", (req, res) => {
  const newUserId = generateRandomString(6);
  const newUserEmail = req.body.email;
  const newUserPwd = req.body.password;
  const hashedPassword = bcrypt.hashSync(newUserPwd, 10);
  let existingUser = checkExistingUser(newUserEmail);
  let userInfo = {};

  if (!newUserEmail || !newUserPwd) {
    errorMsg = "Please enter both fields!";
    userInfo.id = 1;
    userInfo.errorMsg = errorMsg;
    res.status(400);
    res.render("error", userInfo);
  } else if (existingUser){
    errorMsg = "Your email already exists!";
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

app.post("/login", (req, res) => {
  let userInfo = {};
  const userEmail = req.body.email;
  const userPwd = req.body.password;
  let errorMsg = '';
  let id = checkLogin(userEmail, userPwd);

  if (!userEmail || !userPwd) {
    userInfo.id = 1;
    errorMsg = "Please enter both fields.";
    userInfo.errorMsg = errorMsg;
    res.status(403);
    res.render("error", userInfo);
  } else if (!id || id === 1){
    errorMsg = "Your email address or password does't match.";
    userInfo.id = 1;
    userInfo.errorMsg = errorMsg;
    res.status(403);
    res.render("error", userInfo);
  } else {
    //res.cookie('user_id', id);
    req.session.user_id = id;
    res.redirect(302, "/urls");
  }
});

app.post("/urls", (req, res) => {
  const userId = req.session.user_id;
  const longURL = req.body.longURL;
  const db_result = addNewlyToDB(longURL, userId);

  if (!db_result) {
    send("The URL is already exist in your list.");
  } else {
    res.redirect(302, '/urls');
  }

});

// update longURL
app.post("/urls/:id", (req, res) => {
  let userInfo = getUserInfo(req.session.user_id);

  if(!userInfo.id || userInfo.id === 1){
    userInfo.id = 1;
    res.render("urls_index", userInfo);
  } else {
    const updateURL = req.body.formUpdate;
    const updateKey = req.params.id;
    updateURLs(updateKey, updateURL);
    res.redirect(302, "/urls");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  let userInfo = getUserInfo(req.session.user_id);

  if(!userInfo.id || userInfo.id === 1){
    userInfo.id = 1;
    errorMsg = "Please login at first!";
    userInfo.errorMsg = errorMsg;
    //res.status(403);
    res.render("error", userInfo);
  } else {
    for (var key in urlDatabase) {
      if(key === req.params.id) {
        delete urlDatabase[key];
      }
    }
    res.redirect(302,"/urls");
  }
});

app.post("/logout", (req, res) => {
  const user = req.body.user_id;

  req.session = null;
  res.redirect(302, "/urls");
});

// ================ end of POST ================ //

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});



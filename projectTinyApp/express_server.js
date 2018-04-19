var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080

//EJS automatically knows to look inside the views directory for template files
//views subdir created manually
app.set("view engine", "ejs");

// for POST
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
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


function findURL(url) {
  for (var key in urlDatabase){
    if (urlDatabase[key] === url) {
      return key;
    } else {
      let newKey = generateRandomString(6);
      urlDatabase[newKey] = url;
      return newKey;
    }
  }
}

function updateURLs(xKey, yURL) {
  for (var key in urlDatabase){
    urlDatabase[xKey] = yURL;
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
    if ( users[userId].email === userEmail && users[userId].password === userPwd) {
      id = userId;
    }
  }
  return id;
}



// pass url data to the template
app.get("/urls", (req, res) => {
  // cookies
  let userInfo = getUserInfo(req.cookies['user_id']);
  if(!userInfo.id) {
    userInfo.id = false;
    res.render('login', userInfo);
  } else {
    userInfo.urls = urlDatabase;
    res.render("urls_index", userInfo);
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  let userInfo = getUserInfo(req.cookies['user_id']);
  if(!userInfo.id) {
    userInfo.id = false;
    res.render('login', userInfo);
  } else {
    userInfo.urls = urlDatabase;
    res.render("urls_new", userInfo);
  }
});

app.get("/urls/:id", (req, res) => {
  let userInfo = getUserInfo(req.cookies['user_id']);
  if(!userInfo.id) {
    userInfo.id = false;
    res.render('login', userInfo);
  } else {
    userInfo.shortURL = req.params.id;
    userInfo.longURL = urlDatabase;
    res.render("urls_show", userInfo);
    }
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(302, longURL);
});

// reg
app.get("/register", (req, res) => {
  let userInfo = getUserInfo(req.cookies['user_id']);
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
  res.redirect('/urls');
});

// registration
app.post("/register", (req, res) => {
  const newUserId = generateRandomString(6);
  const newUserEmail = req.body.email;
  const newUserPwd = req.body.password;

  let existingUser = checkExistingUser(newUserEmail);
  if (!newUserEmail || !newUserPwd) {
    res.status(400);
    res.send('Please enter both fields.');
  } else if (existingUser){
    res.send('Your email is already exist.');
  } else {
    users[newUserId] = {id: newUserId, email: newUserEmail, password: newUserPwd};
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

app.post("/urls", (req, res) => {
  let shortURL = findURL(inputURL);

  res.redirect(`/urls/${shortURL}`);
});

app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
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



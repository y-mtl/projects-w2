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


function generateRandomString() {
  const str = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const len = 6;

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
      let newKey = generateRandomString();
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

// pass url data to the template
app.get("/urls", (req, res) => {
  //console.log(req.header('cookie'));
  //let cookiesHeader = req.header('cookie');
  //cookies
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, longURL: urlDatabase };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(302, longURL);
});

// add the handler on the root path /
app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.post("/login", (req, res) => {
  const user = req.body.username;
  res.cookie('username', user);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  const user = req.body.username;
  res.clearCookie('username', user);
  res.redirect('/urls');
});

app.post("/urls", (req, res) => {
  //console.log(req.body);  // debug statement to see POST parameters
  //res.send("Ok");         // Respond with 'Ok' (we will replace this)

  // fronend:form name 'whatever' ===> receive on server as 'body.whatever'
  let inputURL = req.body.longURL; // this longURL comes from the front's form name
  let shortURL = findURL(inputURL);

  res.redirect(`/urls/${shortURL}`);
  // 302 This avoids caching sensitive information" or 303?
  // which the client browser would automatically request as a GET)
});

app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});


app.post('/urls/:id', (req, res) => {
  // name attribute from the input text will be the key
  let updateURL = req.body.formUpdate;
  let updateKey = req.params.id;
  updateURLs(updateKey, updateURL);
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});



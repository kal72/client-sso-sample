var express = require('express')
var app = express()
var randomstring = require("randomstring");
var cookieSession = require('cookie-session')
const axios = require('axios');
var FormData = require('form-data');


var clientId = "72f9a71c0c7891b8"
var clientSecret = "c799dc44420b477dbfe57f230d986a6d"
var redirectUri = "http://domain2.com:3002/callback"
var responseType = "code"
var state = ""
var scope = "all"
var grantType = "authorization_code"
var tokenUrl = "http://dashboard.aino.id:9191/api/v1/oauth2/token"
var responseToken

function authorizeUrl(pState){
  return "http://dashboard.aino.id:9191/oauth2/authorize?client_id="+clientId+"&redirect_uri="+redirectUri+"&response_type="+responseType+"&scope="+scope+"&state="+pState
}
 
app.set('view engine', 'pug')
app.use(cookieSession({
  name: 'csid',
  keys: ['!secret!@#'],
}))
app.use('/static', express.static('public'))

app.get('/', function (req, res) {
  if (req.session.loginstate == undefined){
    res.redirect(302, '/login')
  }else{
    res.render('index', responseToken)
  }  
})
app.get('/login', function (req, res) {
  if (req.session.loginstate != undefined){
    res.redirect(302, '/')
  }

  res.render('login', { loginDashboard: '/auth/dashboard' })
})

app.get('/auth/dashboard', function (req, res) {
  state = randomstring.generate(7)
  res.redirect(302, authorizeUrl(state))
})

app.get('/callback', function (req, res) {
  var qCode = req.query.code
  var qState = req.query.state
  console.log("code: ", qCode)
  console.log("state: ",qState)
  if (qState == state && qCode != undefined){
    var formData = new FormData()
    formData.append('grant_type', grantType)
    formData.append('client_id', clientId)
    formData.append('client_secret', clientSecret)
    formData.append('redirect_uri', redirectUri)
    formData.append('code', qCode)
    formData.append('scope', scope)

    axios.create({headers: formData.getHeaders()}).post(tokenUrl, formData)
    .then(function (response) {
      req.session.loginstate=state
      console.log(JSON.stringify(response.data));
      responseToken = response.data
      state = null
      res.redirect(302, '/')
    })
    .catch(function (error) {
      console.log(error.message);
      return res.status(400).send("application error. \n to get parameter from auth server")
    });
  } else{
    res.status(400).send("application error. \n to get parameter from auth server")
  }
})
 
console.log('start in port 3002')
app.listen(3002)
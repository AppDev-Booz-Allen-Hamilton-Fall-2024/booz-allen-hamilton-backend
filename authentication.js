const express = require('express');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2').Strategy;
const session = require('express-session');
const app = require('./server')


// const app = express();

//function to make session secret
function makeid(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}



// Configure Passport with Okta OAuth
passport.use(new OAuth2Strategy({
  authorizationURL: 'https://dev-64890073.okta.com/oauth2/default/v1/authorize',
  tokenURL: 'https://dev-64890073.okta.com/oauth2/default/v1/token',
  clientID: '0oakfcc507HIMlLpw5d7',
  clientSecret:'9SLd0wFQ7AWqN_e4URqVRvL6H7Zm4K3MRLaQqgkSoenfaJGZIrfi8nd0HZ_S9Ahg',
  callbackURL: 'http://localhost:4000/auth/callback' // Redirect, CHANGE TO MICROSERVICE AFTER TESTING
},
function(accessToken, refreshToken, profile, done) {
  return done(null, { profile, accessToken });
}));

// Serialize and desewrialize user into the session
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

module.exports = function(app){
  app.use(session({
    secret: makeid(20),
    resave: false,
    saveUninitialized: true,
  }));

  // Initialize Passport and authenticate
  app.use(passport.initialize());
  app.use(passport.session());

  app.get('/auth/okta', passport.authenticate('oauth2'));
  app.get('/auth/callback', passport.authenticate('oauth2', { failureRedirect: '/' }), (req, res) => {
    //res.redirect(`http://duende-service-url/success?token=${req.user.accessToken}`);
    res.redirect(`google.com`);
  });
};
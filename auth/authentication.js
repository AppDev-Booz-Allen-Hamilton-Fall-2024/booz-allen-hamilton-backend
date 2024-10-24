const passport = require("passport");
const OAuth2Strategy = require("passport-oauth2").Strategy;
require("dotenv").config({ path: "./booz-allen-hamilton-backend/.env" }); // Corrected path to .env

// Configure Passport with Okta OAuth2 using environment variables
passport.use(
  new OAuth2Strategy(
    {
      authorizationURL: process.env.AUTHORITY + "/connect/authorize", // Okta authorization URL
      tokenURL: process.env.AUTHORITY + "/oauth2/default/v1/token", // Okta token URL
      clientID: process.env.CLIENT_ID, // Okta client ID
      clientSecret: process.env.CLIENT_SECRET, // Okta client secret
      callbackURL: process.env.CALLBACK_PATH, // Callback URL
    },
    function (accessToken, refreshToken, profile, done) {
      return done(null, { profile, accessToken });
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

module.exports = function (app) {
  // OAuth2 login route
  app.get("/auth/okta", passport.authenticate("oauth2"));

  // OAuth2 callback route
  app.get(
    "/auth/callback",
    passport.authenticate("oauth2", { failureRedirect: "/" }),
    (req, res) => {
      // Store token and redirect after successful authentication
      res.cookie("access_token", req.user.accessToken);
      res.redirect("/dashboard");
    }
  );

  // Protected dashboard route
  app.get("/dashboard", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.redirect("https://localhost:3000/upload-policies");
    }
    res.send("Welcome to the dashboard!");
  });
};

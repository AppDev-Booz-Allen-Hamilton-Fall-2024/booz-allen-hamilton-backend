const passport = require("passport");
const OAuth2Strategy = require("passport-oauth2").Strategy;
require("dotenv").config({ path: "./booz-allen-hamilton-backend/.env" });

passport.use(
  new OAuth2Strategy(
    {
      clientID: "0oakrzr2ze9ChsWBy5d7",
      authorizationURL:
        "https://dev-34090874.okta.com/oauth2/default/v1/authorize",
      tokenURL: "https://dev-34090874.okta.com/oauth2/default/v1/token",
      clientSecret:
        "13HX0xBim9AqLcbL25DY5aTwRctt2dNm-lJ0mq9fNkq4Ktlb9WCldrenzTcEpD8b",
      callbackURL: "http://localhost:4000/auth/callback",
      scope: ["openid", "profile", "email"],
      state: true,
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
    if (req.isAuthenticated()) {
      return res.redirect("http://localhost:3000/upload-policies");
    }
    res.send("Welcome to the dashboard!");
  });
};

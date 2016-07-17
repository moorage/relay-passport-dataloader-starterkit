/* eslint-disable no-console, no-shadow */
import path from 'path';
import webpack from 'webpack';
import express from 'express';
import graphQLHTTP from 'express-graphql';
import WebpackDevServer from 'webpack-dev-server';
import historyApiFallback from 'connect-history-api-fallback';
import chalk from 'chalk';
import webpackConfig from '../webpack.config';
import config from './config/environment';
import schema from './data/schema';

var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

// Use the GoogleStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Google
//   profile), and invoke a callback with a user object.
passport.use(new GoogleStrategy({
    clientID: config.google.clientId,
    clientSecret: config.google.clientSecret,
    callbackURL: "http://${config.server}:${config.port}/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      console.log(err, user);
      return done(err, user);
    });
  }
));

if (config.env === 'development') {
  // Launch GraphQL
  const graphql = express();
  graphql.use('/', graphQLHTTP({
    graphiql: true,
    pretty: true,
    schema
  }));
  graphql.listen(config.graphql.port, () => console.log(chalk.green(`GraphQL is listening on port ${config.graphql.port}`)));

  // Launch Relay by using webpack.config.js
  const relayServer = new WebpackDevServer(webpack(webpackConfig), {
    contentBase: '/build/',
    proxy: {
      '/graphql': `http://localhost:${config.graphql.port}`
    },
    stats: {
      colors: true
    },
    hot: true,
    historyApiFallback: true
  });

  // Serve static resources
  relayServer.use('/', express.static(path.join(__dirname, '../build')));
  relayServer.listen(config.port, () => console.log(chalk.green(`Relay is listening on port ${config.port}`)));
} else if (config.env === 'production') {
  // Launch Relay by creating a normal express server
  const relayServer = express();
  relayServer.use(historyApiFallback());
  relayServer.use('/', express.static(path.join(__dirname, '../build')));
  relayServer.use('/graphql', graphQLHTTP({ schema }));
  relayServer.listen(config.port, () => console.log(chalk.green(`Relay is listening on port ${config.port}`)));
}

relayServer.get('/auth/google',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] }));

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
relayServer.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

const passport = require('passport');
const User = require('../models/user');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt')

// Create local Strategy
const localOptions = { usernameField: 'email' }
const localLogin = new LocalStrategy(localOptions, async function (email, password, done) {
  try {
    // Veify this email and password, call done with the user
    // if it is the corrent email and password
    // otherwise, call done with false
    const user = await User.findOne({
      where: { email: email.toLowerCase() }
    })

    if (!user) return done(null, false)

    const isMatch = await bcrypt.compare(password, user.password)
    if (isMatch) {
      return done(null, user)
    } else {
      return done(null, false)
    }
  } catch (err) {
    return done(err)
  }
});


// Setup options or JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromHeader('auth'),
  secretOrKey: process.env.SECRET
};

// Create JWT Strategy
const jwtLogin = new JwtStrategy(jwtOptions, async function (payload, done) {
  try {
    // See if the user ID in the payload exists in our database
    // If it does, call 'done' with that user
    // otherwise, call done without a user object
    const user = await User.findOne({
      where: {
        id: payload.sub
      }
    })
    if (user) {
      done(null, user);
    } else {
      done(null, false);
    }
  } catch (err) {
    return done(err)
  }
});

// Tell passport to use this strategy
passport.use(jwtLogin);
passport.use(localLogin);

const jwt = require('jwt-simple');
const User = require('../models/user');
const bcrypt = require('bcrypt')

function tokenForUser(user) {
  // sub => Subject, iat => Issue at time
  const timestamp = new Date().getTime();
  return jwt.encode({ sub: user.id, iat: timestamp }, process.env.SECRET);
}

exports.signin = (req, res, next) => {
  // User has already had theor email and password auth'd
  // We just need to give them a token
  res.send({ token: tokenForUser(req.user) });
};

exports.signup = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password

  if (!email || !password) {
    return res.status(422).json({ error: 'You must provide email and password' });
  }

  const salt = await bcrypt.genSalt(10)
  const hash = await bcrypt.hash(req.body.password, salt, null)

  // See if a user wth the given email exists
  const existingUser = await User.findOne({
    where: {
      email
    }
  })

  if (existingUser) {
    return res.status(422).json({ error: 'Email already existed' });
  }

  const user = await User.create({
    email: email,
    password: hash,
    firstName: req.body.firstName,
    lastName: req.body.lastname
  });

  res.json({ token: tokenForUser(user) })
};

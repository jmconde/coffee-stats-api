const express = require('express');
const passport = require('passport')
const LocalStrategy = require('passport-local');
const { initSessionsData, createUser, authenticate, changePassword } = require('../controllers/adminController');
const router = express.Router();

const NOT_AUTHENTICATED = 'not-authenticated';
const WRONG_PASSWORD = 'wrong-password';
const checkAuthenticated = (req) => {
  if (!req.isAuthenticated()) {
    throw new Error(NOT_AUTHENTICATED);
  }
};

passport.use(new LocalStrategy(async function verify(username, password, cb) {
  try {
    const user = await authenticate(username, password);
    delete user._id;

    if (user) {
      return cb(null, user);
    }
    return cb(null, false, { message: 'Incorrect username or password.' });
  } catch (err) {
    return cb(null, false, { message: 'Incorrect username or password.' });
  }
}));

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    const { id, username, roles, firstname, lastname, vid } = user;
    cb(null, { id, username, roles, firstname, lastname, vid });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});


router.get('/init-sessions', async(req, res) => {
  try {
    await initSessionsData(req.query);
    res.status(200);
  } catch (err) {
    console.log('error', err.response);
  }
});

router.post('/user/create', async(req, res) => {
  await createUser(req);
  res.status(201);
});

router.post('/user/authenticate',
  passport.authenticate('local'),
  function(req, res) {
    res.json(req.user);
  });

router.post('/user/password-change',
  async function(req, res, next) {
    try {
      checkAuthenticated(req);
      await changePassword(req);
      console.log('pasword changed');
      res.status(200).send();
    } catch (err) {
      if (err.message === NOT_AUTHENTICATED || err.message === WRONG_PASSWORD) {
        res.status(401).json({
          error: err.message
        });
        next();
      } else {
        res.status(500).send();
      }
    }
  });

router.get('/user/alive',
  function(req, res) {
    console.log('req.user :>> ', req.isAuthenticated());
    res.status(200).json(req.user);
  });

router.get('/user/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.session.destroy();
    res.status(200).send();
  });
});


module.exports = router;
require('dotenv').config();

const sync = require('./app/tasks/sync');
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const cors = require("cors");
const helmet = require("helmet");
const session = require('express-session');
const passport = require('passport');

const RedisStore = require("connect-redis")(session);

const ivaoRoutes = require('./app/routes/ivao');
const ltsRoutes = require('./app/routes/lts');
const adminRoutes = require('./app/routes/admin');
const acarsRoutes = require('./app/routes/acars');

sync.sync();

const app = express();

const whitelist = process.env.HOSTS_WHITELIST ? process.env.HOSTS_WHITELIST.split(',') : [];

// parse application/json
app.use(bodyParser.json());
app.use(cookieParser());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
var corsOptions = {
  origin: function(origin, callback) {
    if (origin === undefined || whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
};
// use cors options
app.use(cors(corsOptions));
app.use(helmet.referrerPolicy({
  policy: ["origin", "unsafe-url"],
}));
app.use(express.static('assets'));

const { createClient } = require("redis");
const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST,
  },
  legacyMode: true
});
redisClient.connect().catch(console.error);

app.use(session({
  secret: '94e353a57052a1bc1808a2010d74f8a5',
  resave: false,
  saveUninitialized: false,
  store: new RedisStore({ client: redisClient }),
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 60 * 24
  }
}));
app.use(passport.authenticate('session'));

// routes
app.use('/api/v1/ivao', ivaoRoutes);
app.use('/api/v1', ltsRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/acars', acarsRoutes);

// app.use(function(req, res, next) {
//   var msgs = req.session.messages || [];
//   res.locals.messages = msgs;
//   res.locals.hasMessages = !!msgs.length;
//   req.session.messages = [];
//   next();
// });

// app.use(passport.initialize());
// app.use(passport.session());



// listening port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
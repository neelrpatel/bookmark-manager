const express = require('express');
const mongoose = require('./config/database');
const passport = require('./config/passport');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const moment = require('moment');
const morgan = require('morgan');
const path = require('path');
const methodOverride = require('method-override');
const expressEjsLayouts = require('express-ejs-layouts');
const { ensureAuthenticated } = require('./middleware/auth');

const app = express();

// Logging middleware (dev environment)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Sessions middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
    store: new MongoStore({ mongooseConnection: mongoose.connection })
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Body parsing middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Method override middleware
app.use(
  methodOverride((req, res) => {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      const method = req.body._method;
      delete req.body._method;
      return method;
    }
  })
);

// EJS and views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/layout');
app.use(expressEjsLayouts);
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});
app.locals.formatDate = (date) => moment(date).utc().format('MMMM Do YYYY');

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/folders', require('./routes/folders'));
app.use('/bookmarks', require('./routes/bookmarks'));

// 404 Page Not Found middleware
app.use(ensureAuthenticated, (req, res, next) => {
  const error = new Error('Sorry, the page you were looking for could not be found.');
  error.status = 404;
  error.title = 'Page Not Found';
  next(error);
});

// Error handler middleware
app.use(ensureAuthenticated, (error, req, res, next) => {
  const status = error.status || 500;
  res.status(status).render('errors/page', {
    status,
    title: error.title || 'Unexpected Error',
    message:
      status !== 500 && error.title
        ? error.message
        : 'Sorry, an error occurred while trying to handle your request.'
  });
});

// Listen to port
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server started on port ${port}`));

require('dotenv').config();

const createError = require('http-errors');
const express = require('express');
const path = require('path');

const cookieParser = require('cookie-parser');
const session = require('express-session');
const FileStore = require('session-file-store')(session);

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');

const webSocket = require('./websockets');

const app = express();
const PORT = process.env.PORT ?? 3000;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(session({
  store: new FileStore(),
  secret: process.env.SESSION_SECRET ?? 'sdgASFAfASDSD232',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false },
  name: 'auth',
}));
app.use((req, res, next) => {
  res.locals.username = req.session.username;
  res.locals.userId = req.session.userId;
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

webSocket(app.listen(PORT));

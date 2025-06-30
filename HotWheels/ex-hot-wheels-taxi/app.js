var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const mongoose = require('mongoose');
const mongoDB = "mongodb://psi026:psi026@localhost:27017/psi026?retryWrites=true&authSource=psi026";


main().catch((err) => console.log(err));
async function main() { 
  await mongoose.connect(mongoDB);
}

const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());


var indexRouter = require('./routes/index');
var driverRouter = require('./routes/driverRouter');
var priceRouter = require('./routes/priceRouter');
var taxiRouter = require('./routes/taxiRouter');
var tripRouter = require('./routes/tripRouter')
var usersRouter = require('./routes/users');
var shiftRouter = require('./routes/shiftRouter');
var personRouter = require('./routes/personRouter');
var requestRouter = require('./routes/requestRouter');
var routeRouter = require('./routes/routeRouter');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/', driverRouter);
app.use('/', priceRouter);
app.use('/', taxiRouter);
app.use('/', tripRouter);
app.use('/', shiftRouter);
app.use('/', personRouter);
app.use('/', requestRouter);
app.use('/api/routes', routeRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

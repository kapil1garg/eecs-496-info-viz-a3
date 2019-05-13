// packages to run server
const path = require('path');
const express = require('express');
const favicon = require('serve-favicon');

// get routes and start setup of app
const app = express();

// add favicon
app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));

// app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/data'));

// setup default route
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + 'index.html'));
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
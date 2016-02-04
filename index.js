// connect to the data base
// then show our menu entry
// color it up here, and call methods
// config here
var mongoose = require('mongoose'),
    Q = require('q'),
    defer = Q.defer(),
    // Models = require('models/model'),
    dbURI = 'mongodb://localhost:27017/bot';

var db = mongoose.connection;
// Create the database connection
mongoose.connect(dbURI);

// CONNECTION EVENTS
// When successfully connected
db.on('connected', function() {
    console.log('Mongoose default connection open to ');
    defer.resolve();
});

// If the connection throws an error
db.on('error', function(err) {
    console.log('Mongoose default connection error: ' + err);
    defer.reject(err);

});
// When the connection is disconnected
db.on('disconnected', function() {
    console.log('Mongoose default connection disconnected');
});
// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function() {
    db.close(function() {
        console.log('Mongoose default connection disconnected through app termination');
        process.exit(0);
    });
});

module.exports = defer.promise;
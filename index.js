// connect to the data base
// then show our menu entry
// color it up here, and call methods
// config here
var mongoose = require('mongoose'),
    Q = require('q'),
    defer = Q.defer(),
    Models = require('./libs/model'),
    argv = require('yargs').argv,
    fs = require('fs'),
    path = require('path'),
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




if (!argv.command) {
    //show help
}
//Commands
//addJob,removeJob,clearComplete,listProgress
switch (argv.command) {
    case 'add_job':
        var doc = Models.jobaway(argv.job_name);
        var save_doc = new Models(doc['job_record.job_name'], doc['job_record.starting_url']);
        save_doc.findOrUpdateJobProgress(null, doc)
        .then(function (gen) {
            if (gen.ok) {
                //start timer and begin
                //processing crawler jobs
            }
        });
    break;
    case 'remove_job':
    break;
    case 'clear_complete':
    break;
    case 'list_progress':
    break;
    default:
        //return or echo out help.
    break;
}

module.exports = defer.promise;
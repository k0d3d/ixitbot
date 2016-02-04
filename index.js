// connect to the data base
// then show our menu entry
// color it up here, and call methods
// config here
var mongoose = require('mongoose'),
    Q = require('q'),
    defer = Q.defer(),
    Models = require('./libs/model'),
    argv = require('yargs').argv,
    Xray = require('x-ray'),
    fs = require('fs'),
    path = require('path'),
    dbURI = 'mongodb://localhost:27017/bot';

var db = mongoose.connection;
// Create the database connection
mongoose.connect(dbURI);

// CONNECTION EVENTS
// When successfully connected
db.on('connected', function() {
    console.log('database connected');
    initialize();
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


function initialize () {
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
                if (gen._id) {
                    //start timer and begin
                    //processing crawler jobs
                    var x = Xray();
                    x(doc.proceed_from_url, doc['job_record.scope'], doc.schema)
                    .limit(10)
                    .write('results.json')
                    (function (err, obj) {
                        console.log(err, obj);
                    });
                }
            });
        break;
        case 'remove_job':
        break;
        case 'list_progress':
        break;
        default:
            //return or echo out help.
        break;
    }
}


module.exports = defer.promise;
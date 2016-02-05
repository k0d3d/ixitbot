/**
 * BOOTUP
 * *INDEXING*
 * When ixitbot runs from the command line,
 * it checks the definitions folder & files
 * to see what jobs are defined. It then
 * starts a cron for each job, that repeates
 * it self every 5mins proceeding to the next
 * page on each iteration.
 *
 * *ACTION ON EACH RECORD FROM A PAGE*
 * Each iteration contains a minimum of one
 * element in an array.
 * Each element/item in the array is sent to
 * agenda, to be executed in increments of
 * 3mins. Use a schedule and a forLoop.
 *
 * The agenda task will make a request to
 * VAULT when it is run.
 * This data is forwarded
 * in its schema to the API Server and VAULT,
 * The data in the schema is recorded as tags, to
 * enable intelligent collection/indexing.
 * create an ixit link/entry and return the data
 * to ixitbot.
 * VAULT uses the data sent to download the file,
 * IXITBot creates / updates the job entry for
 * this iteration, like the count, the .
 *
 *
 * *TWEETING*
 * When ixitbot runs from the command line,
 * it checks the definitions folder & files
 * to see what jobs are defined. It then
 * starts a cron for each job.
 *
 * *BACKGROUND PROCESS*
 *
 * For each starting url, the first page is crawled,
 * the first item on the result array is collected,
 * sent as an AGENDA task to be downloaded, nd the
 * response from vault is tweeted.
 *
 *
 *
 * that repeates
 * it self every 5mins proceeding to the next
 * page on each iteration.
*/
var mongoose = require('mongoose'),
    Q = require('q'),
    defer = Q.defer(),
    fs = require('fs'),
    agenda = require('./libs/agenda'),
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


function handleError (er) {
    if (er instanceof Error) {
        throw er;
    } else {
        throw new Error('' + er);
    }
}



function initialize () {
    // Lets read in the definitions directory
    fs.readdir('./def', function (err, files) {
        if (err) {
            handleError(err);
        }
        if (files.length) {
            //first we have to process each json into
            //a collection
            var defDocument = [];
            for (var a in files) {
                if (files.hasOwnProperty(a)) {
                    var d = require('./def/' + files[a]);
                    defDocument.push(d);
                    //An agenda job right here, should include a function
                    //that fetches the status of the job to be executed
                    //per iteration and uses that to construct the task to
                    //be carried out when ever that definition is used.
                    //
                }
            }
            agenda.agenda.on('ready', function() {
                // Well we need to start two crons for each
                for (var i = 0; i < defDocument.length; i++) {
                    console.log('adding located definitions: %s', defDocument[i].job_name);
                    agenda.agenda.now('start job', defDocument[i], function () {console.log('start job');});
                }
                console.log('started');
                agenda.agenda.start();
            });
        } else {
            handleError('No definitions found, Read it up somewhere. I know I told u how to work this');
        }
    });
}









// function initialize () {
//                // (function (err, obj) {
//                     //     if (err) {
//                     //         throw err;
//                     //     }
//                     //     if (obj.length) {
//                     //         //for each object, schedule
//                     //         //a task on agenda to be carried out
//                     //         //
//                     //         //upload thumbnail then
//                     //         //send tweets and
//                     //         var tweet = new Social().tweet;
//                     //         tweet({
//                     //             status: obj[0].title
//                     //         });
//                     //         //send facebook and
//                     //         //send gplus
//                     //         //send instagram
//                     //         //keep sending
//                     //         return console.log('No of records crawled: %d', obj.length);
//                     //         // process.exit();
//                     //     }
//                     //     console.log('Nothing to crawl!!! Check config in jobdef.json');
//                     // });
//                 } else {
//                     throw new Error('No document returned. Possible internal error. idk, ehm!, Try something else.');
//                 }
// }


module.exports = defer.promise;
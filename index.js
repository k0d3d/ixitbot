require('newrelic');
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
 * kue, to be executed in increments of
 * 3mins. Use a schedule and a forLoop.
 *
 * The kue task will make a request to
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
    // Q = require('q'),
    // defer = Q.defer(),
    debug = require('debug')('ixitbot:boot'),
    runner = require('./libs/runner'),
    CronJob = require('cron').CronJob,
    fs = require('fs'),
    dbURI = process.env.IXIT_APP_MONGO_DB || process.env.IAMDB;


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
            for (var a = 0; a < files.length; a++) {
                if (files[a].indexOf('.js') > -1) {
                    var d = require('./def/' + files[a]);
                    d.defUri =  './def/' + files[a];
                    defDocument.push(d);
                }

            }
            for (var i = 0; i < defDocument.length; i++) {
                var this_doc = defDocument[i];
                if (!this_doc.def && !this_doc.def.job_name) {
                    throw new Error('required filename or title not present in schema');
                }
                // create dynamic job definitions, then start job
                runner.defineJobs(this_doc.def.job_name);
                runner.queue.create(this_doc.def.job_name + '-start job', this_doc).removeOnComplete( true ).save();
            }
        } else {
            handleError('No definitions found, Read it up somewhere. I know I told u how to work this');
        }
    });
}

var db = mongoose.connection;
// Create the database connection
mongoose.connect(dbURI);

// CONNECTION EVENTS
// When successfully connected
db.on('connected', function() {
    debug('database connected');
        return initialize();
    var job = new CronJob({
    /*
     * Runs every minute of every day.
     */
      cronTime: '* * * 1/1 *',
      onTick: function() {
        debug('inits');
        initialize();
      },
      start: false,
      timeZone: 'Africa/Lagos'
    });
    job.start();
    // defer.resolve();
});

// If the connection throws an error
db.on('error', function(err) {
    debug('Mongoose default connection error: ' + err);
    // defer.reject(err);

});
// When the connection is disconnected
db.on('disconnected', function() {
    debug('Mongoose default connection disconnected');
});
// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function() {
    db.close(function() {
        debug('Mongoose default connection disconnected through app termination');
        process.exit(0);
    });
});















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
//                     //         return debug('No of records crawled: %d', obj.length);
//                     //         // process.exit();
//                     //     }
//                     //     console.log('Nothing to crawl!!! Check config in jobdef.json');
//                     // });
//                 } else {
//                     throw new Error('No document returned. Possible internal error. idk, ehm!, Try something else.');
//                 }
// }


// module.exports = defer.promise;
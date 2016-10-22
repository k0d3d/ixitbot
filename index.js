require('newrelic');
/**
 * BOOTUP
 * *INDEXING*
 * When ixitbot runs from the command line,
 * the below arguments are required to
 * create an instance of IASS that should
 * peform the crawl.
 * eg. `index.js --mode=crawl --jobName=tooexclusive`
 *
 * --jobName this should correspond with the definitions
 *            file store in ./def .
 *            eg. `--jobName=linda` -> ./def/linda.json
 *
 * --entryUrl
 *
 *
 *
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
    Q = require('q'),
    defer = Q.defer(),
    debug = require('debug')('ixitbot:boot'),
    runner = require('./libs/runner'),
    CronJob = require('cron').CronJob,
    fs = require('fs'),
    errors = require('common-errors'),
    argv = require('yargs').argv,
    dbURI = process.env.IXIT_APP_MONGO_DB || process.env.IAMDB;

if (!process.env.VAULT_RESOURCE ) {
    throw new errors.ConnectionError('env var value unavailable');
}

function handleError (er) {
    if (er instanceof Error) {
        throw er;
    } else {
        throw new Error('' + er);
    }
}

function initialize_crawl (jobName) {

        //first we have to process each json into
        //a collection
        var d;
        try {
            d = require('./def/' + jobName);
            d.defUri =  './def/' + jobName;

        } catch (e) {
            console.log(e);
            debug('its possible the definition file for this job is absent. Check the def/ directory');
            throw e;
        }

        var this_doc = d;
        if (!this_doc.def && !this_doc.def.job_name) {
            throw new Error('required filename or title not present in schema');
        }
        // create dynamic job definitions, then start job
        runner.defineJobs(this_doc.def.job_name);
        runner.queue.create(this_doc.def.job_name + '-start job', this_doc).removeOnComplete( true ).save();


}

function latest_posts (entryUrl, jobName) {
        var InstigatorLOL = require('./index');
        var RunnerMofo = require('./libs/runner');
        var ModelLogic = require('./libs/model');

        var documentDefinition = {
          'job_name' : jobName,
          'proceed_from_url': entryUrl
        };


        var _logic = new ModelLogic();
        // _logic.after('saveFileMeta', RunnerMofo.tweetAsPost);
        InstigatorLOL.then(function () {
            debug('db one crawled_item');
            RunnerMofo.latestPost(documentDefinition, function (crawled_item) {
                //saved item
                debug(crawled_item);
                if (!crawled_item) {
                    return false;
                }
                return _logic.saveFileMeta(crawled_item).then(function (file_saved) {

                      //get ixit link and tweet it
                      var hashr = require('./libs/hash');
                      RunnerMofo.tweetAsPost({
                        status: 'Download & Listen ' + crawled_item.title +
                            ' http://ixit.pw/'+ hashr.hashOid(file_saved._id) +
                            ' #iXit4Music @ixitbot #followUsfastDownloadSpeeds'
                      });
                    }, function (err) {
                        throw err;
                    })
                    .catch(function (e) {
                        console.log(e);
                        console.log(e.stack);
                    });

            });
        });
}

var db = mongoose.connection;
// Create the database connection
mongoose.connect(dbURI);

// CONNECTION EVENTS
// When successfully connected
db.on('connected', function() {
    debug('database connected');
    defer.resolve(db);
        // return initialize();
        if (argv.mode === 'crawl') {
            if (argv.jobName) {
                return initialize_crawl(argv.jobName);
            }
        } else if (argv.mode === 'new-post') {
            if (!argv.entryUrl ||
                !argv.jobName) {
                return debug('specify jobName and entryUrl arguments');
            }

            var j = new CronJob ('* * * 1/1 *',
            function () {
                latest_posts(argv.entryUrl, argv.jobName);
                debug('running-> ');
            },
            function () {
                debug('stopped');
            },
            true,
            'Africa/Lagos',
            false,
            true);

            j.start();

        } else{
            debug("You did not tell me what task I should do. Add the required CLI argument.");
            process.exit(0);
        }
        // return debug('No valid command in arguments');

    // defer.resolve();
});

// If the connection throws an error
db.on('error', function(err) {
    debug('Mongoose default connection error: ' + err);
    defer.reject(err);

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

module.exports = defer.promise;














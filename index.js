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
    Q = require('q'),
    defer = Q.defer(),
    debug = require('debug')('ixitbot:boot'),
    runner = require('./libs/runner'),
    CronJob = require('cron').CronJob,
    fs = require('fs'),
    errors = require('common-errors'),
    argv = require('yargs').argv,
    dbURI = process.env.IXIT_APP_MONGO_DB || process.env.IAMDB;

if (
  !process.env.IASS_HTTP_PORT ||
  !process.env.VAULT_RESOURCE ) {
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

function latest_posts (entryUrl, domainId) {
        var InstigatorLOL = require('./index');
        var RunnerMofo = require('./libs/runner');
        var ModelLogic = require('./libs/model');

        var documentDefinition = {
          'job_name' : domainId,
          'proceed_from_url': entryUrl,
          'props': {}
        };


        var _logic = new ModelLogic();
        // _logic.after('saveFileMeta', RunnerMofo.tweetAsPost);
        InstigatorLOL.then(function () {
            debug('db one crawled_item');
            RunnerMofo.onePageCrawl(documentDefinition, function (crawled_item) {
                //saved item
                debug(crawled_item);
                RunnerMofo.uploadOneFile(crawled_item, function (ixit_file) {
                    return _logic.saveFileMeta(ixit_file, crawled_item)

                    //send to vault
                    //
                    .then(function () {
                      //get ixit link and tweet it
                      var hashr = require('./libs/hash');
                      RunnerMofo.tweetAsPost({
                        status: 'Download & Listen ' + crawled_item.title + '-> http://i-x.it/'+ hashr.hashInt(ixit_file.mediaNumber) +' #shareIxitLinks #followUsfastDownloadSpeeds'
                      });
                      // reply(ixit_file.mediaNumber);
                    }, function (err) {
                        throw err;
                    })
                    .catch(function (e) {
                        console.log(e);
                        console.log(e.stack);
                    });
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
            if (argv.domainId) {
                var jobName = argv.domainId;
                return initialize_crawl(jobName);
            }
        } else if (argv.mode === 'new-post') {
            if (!argv.entryUrl ||
                !argv.domainId) {
                return debug('specify domainId and entryUrl arguments');
            }
            return latest_posts(argv.entryUrl, argv.domainId);
        }
        return debug('No valid command in arguments');
    var job = new CronJob({
    /*
     * Runs every minute of every day.
     */
      cronTime: '* * * 1/1 *',
      onTick: function() {
        debug('inits');
        initialize_crawl();
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














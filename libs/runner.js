var redis = require('redis');
var client = redis.createClient({
  detect_buffers: true,
  url: process.env.REDIS_URL
});
var
    kue = require('kue'),
    queue = kue.createQueue({
      redis: process.env.REDIS_URL
    }),
    request = require('request'),
    Models = require('./model'),
    _ = require('lodash'),
    debug = require('debug')('ixitbot:runner'),
    // counter_debug = require('debug')('ixitbot:counter'),
    // JSONStream = require('JSONStream'),
    // es = require('event-stream'),
    osmosis = require('osmosis');


function startOsmosis (job, done) {
  debug('starting crawler');
  var job_data = job.data;
  job_data.scraper = require('../def/' + job_data.job_record.job_name).scraper;

  function _data(listing) {
      // assuming this is going to fire for
      // every row in our collection, we need
      // to update our database with the row
      // count after we have totally sent them
      // to the Vault,
      var nameString = (job_data.job_record) ? job_data.job_record.job_name : job_data.job_name;

        //increment the current job count in redis
        client.incr(nameString + '_session_count', function (err, count) {
          if (err) {
            console.log(err);
            return done(err);
          }
          if (!count) {
            count = 1;
          }
          //save the current url in redis also.
          var saveUrl = job_data.proceed_from_url || job_data.proceed_from_url;
          client.set(nameString + '_last_url', saveUrl);
          var new_model = new Models();

          //save data
          new_model.saveFileMeta(listing, job_data)
          .then(function (saved) {
            debug('saved and updated including file meta');
            debug(saved);
            done();
          }, function (err) {
            console.log(err);
            console.log('we got an error');
            done(err);
          });
        });

      return done();
      // queue.create(nameString+ '-send to vault', _.extend({}, listing, job_data))
      // .removeOnComplete( true )
      // .save();
  };

  //start scraper
  job_data.scraper(osmosis, _data, job_data);
}


function startjob (job, done) {
  var jobData = job.data;
  debug('Running Job on: %s', jobData.def.job_name);
  var doc = Models.prepareInitialDocument(jobData.def);
  doc.then(function (p) {

    var save_doc = new Models();
    //An kue job right here, should include a function
    //that fetches the status of the job to be executed
    //per iteration and uses that to construct the task to
    //be carried out when ever that definition is used.
    //
    save_doc.findOrUpdateJobProgress(p, {
      no_of_records_saved: p.no_of_records_saved,
      proceed_from_url: p.proceed_from_url
    })
    .then(function (useThisD) {
      var preped = Models.prepareUpdatedDocument(useThisD);
      queue.create(jobData.def.job_name + '-start osmosis',
        preped,
        function () {
        })
      .removeOnComplete( true )
      .save();
      done();
    });
  });
}
/**
 * sends a request to the fileserver to
 * download a file using the job description
 * and create an ixit link. it then returns
 * the ixit link. this function can be used
 * during both indexing and routine crawling
 * operations.
 * @param  {[type]}   job  [description]
 * @param  {Function} done [description]
 * @return {[type]}        [description]
 */
function sendToVault (job, done) {
  var md5 = require('md5');
  var jobData = job.data;
  jobData.chunkNumber = 1;
  jobData.totalChunks = 1;
  jobData.filename = jobData.filename || md5(jobData.title);
  jobData.owner = jobData.job_name || 'www-anon';
  jobData.folder = jobData.job_name || 'ixitbot';
  // debug(jobData);
  request({
    method: 'POST',
    url: process.env.VAULT_RESOURCE + '/upload/automate',
    body: jobData,
    json: true
  }, function (err, r, ixitFile) {
    if (!err) {
      //increment the current job count in redis
      var nameString = (jobData.job_record) ? jobData.job_record.job_name : jobData.job_name;
      client.incr(nameString + '_session_count', function (err, count) {
        if (err) {
          console.log(err);
          return done(err);
        }
        if (!count) {
          count = 1;
        }
          var saveUrl = job_data.proceed_from_url || job_data.url || job_data.starting_url

          client.set(nameString + '_last_url', saveUrl);
        var new_model = new Models();
        new_model.saveFileMeta(ixitFile, jobData)
        .then(function () {
          console.log('saved and updated including file meta');
          done();
        }, function (err) {
          console.log(err);
          console.log('we got an error');
          done(err);
        });
      });
    }
    done();
  });
}

function updateJobCount (job, done) {
  var new_model = new Models();
  debug(job.data);
  var fileData = job.data[0];
  var jobData = job.data[1];
  new_model.findOrUpdateJobProgress(jobData, {
    no_of_records_saved: jobData.no_of_records_saved
  })
  .then(function (progressData) {
    new_model.saveFileMeta(fileData, progressData)
    .then(function () {
      console.log('saved and updated including file meta');
      done();
    }, function (err) {
      console.log(err);
      console.log('we got an error');
      done(err);
    });

  });
}

function defineJobs (jobname) {
  debug('defining jobs');
  queue.process(jobname + '-start job', startjob);
  queue.process(jobname + '-start osmosis', startOsmosis);
  queue.process(jobname + '-send to vault', sendToVault);
  queue.process(jobname + '-save progress to db', updateJobCount);
}




module.exports.defineJobs = defineJobs;
module.exports.queue = queue;



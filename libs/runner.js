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
    Q = require('q'),
    debug = require('debug')('ixitbot:runner'),
    // counter_debug = require('debug')('ixitbot:counter'),
    // JSONStream = require('JSONStream'),
    // es = require('event-stream'),
    osmosis = require('osmosis');
var errors = require('common-errors');


function startOsmosis (job, done) {
  debug('starting crawler');
  var job_data = job.data, osmosis_instance;
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
          debug('count as at increment', count);
          //save the current url in redis also.
          var saveUrl = job_data.proceed_from_url || job_data.proceed_from_url;
          client.set(nameString + '_last_url', saveUrl);
          var new_model = new Models();

          //save data
          new_model.saveFileMeta(listing, job_data)
          .then(function () {
            debug('saved and updated including file meta');
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
  osmosis_instance = job_data.scraper(osmosis, _data, job_data);
}


function startjob (job, done) {
  var card = job.data.def;
  debug('Running Job on: %s', card.job_name);
  var doc = Models.prepareInitialDocument(card);
  doc.then(function (p) {

    var save_doc = new Models();
    //An kue job right here, should include a function
    //that fetches the status of the job to be executed
    //per iteration and uses that to construct the task to
    //be carried out when ever that definition is used.
    //
    // save_doc.findOrUpdateJobProgress(p, {
    //   no_of_records_saved: p.no_of_records_saved,
    //   proceed_from_url: p.proceed_from_url
    // })
    save_doc.findOrUpdateJobProgress(p.job_name, p)
    .then(function (useThisD) {
      var preped = Models.prepareUpdatedDocument(useThisD);
      queue.create(card.job_name + '-start osmosis',
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
function uploadWhileCrawling (job, done) {
  var md5 = require('md5');
  var jobData = (job.job_name)?job :job.data;
  jobData.chunkNumber = 1;
  jobData.totalChunks = 2;
  jobData.filename = jobData.filename || md5(jobData.title);
  jobData.owner = jobData.job_name || 'www-anon';
  jobData.folder = jobData.job_name || 'ixitbot';
  request({
    method: 'POST',
    url: process.env.VAULT_RESOURCE + '/upload/automate',
    body: jobData,
    json: true
  }, function (err, r, ixitFile) {
    if (!err && r.statusCode <= 210) {
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
        var saveUrl = jobData.proceed_from_url || jobData.proceed_from_url;
        if (arguments.length > 2) {
          client.set(nameString + '_last_url', saveUrl);
        }

        var new_model = new Models();
        new_model.saveFileMeta(ixitFile, jobData)
        .then(function () {
          console.log('saved and updated including file meta');
          done(ixitFile);
        }, function (err) {
          console.log(err);
          console.log('we got an error');
           done(new errors.ConnectionError('vault resource operation error', err));
        });
      });
    } else {
      if (err) {
        done(new errors.ConnectionError('vault resource connection error', err));
      } else {
        done(new errors.ConnectionError('vault resource operation failure. This is a very strange event. Get bug buster'));
      }
    }
    // done();
  });
}

/**
 * sends a request to ISAS to download a file.
 * The request is composed using parameters that
 * contain a source url which should contain the
 * binary data to be downloaded.
 * @param  {[type]}   jobData [description]
 * @param  {Function} done    callback function
 * @return {[type]}           Promise
 */
function uploadOneFile (jobData, done) {
  var md5 = require('md5');
  var q = Q.defer();


  jobData.chunkNumber = 1;
  jobData.totalChunks = 2;
  jobData.filename = jobData.filename || md5(jobData.title);
  jobData.owner = jobData.job_name || 'www-anon';
  jobData.folder = jobData.job_name || 'ixitbot';
  request({
    method: 'POST',
    url: process.env.VAULT_RESOURCE + '/upload/automate',
    body: jobData,
    json: true
  }, function (err, r, ixitFile) {
    if (!err && r.statusCode <= 210) {
      return (typeof done === 'function') ? done(ixitFile)
        : q.resolve(ixitFile);

    } else {
      if (err) {
        return (typeof done === 'function') ? done(new errors.ConnectionError('vault resource connection error', err))
          : q.resolve(ixitFile);

      } else {
        return (typeof done === 'function') ? done(new errors.ConnectionError('vault resource operation failure. This is a very strange event. Get bug buster'))
          : q.resolve(ixitFile);

      }
    }
    // done();
  });

  return q.promise;
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
  queue.process(jobname + '-send to vault', uploadWhileCrawling);
  queue.process(jobname + '-save progress to db', updateJobCount);
}

/**
 * this function will....
 * @param  {[type]}   job  [description]
 * @param  {Function} done [description]
 * @return {[type]}        [description]
 */
function onePageCrawl (job, done) {
  debug('starting onepage crawler');
  var job_data = job;

  var d;
  try {
      d = require('../def/' + job.job_name);
      d.defUri =  '../def/' + job.job_name;

  } catch (e) {
      console.log(e);
      debug('its possible the definition file for this job is absent. Check the def/ directory');
      throw e;
  }
  var scraper = require('../def/' + job_data.job_name).onePage;
  function _data(listing) {
      // assuming this is going to fire for
      // every row in our collection, we need
      // to update our database with the row
      // count after we have totally sent them
      // to the Vault,
      return done(listing);
  }

  //start scraper
  scraper(osmosis, _data, job_data);
}
function latestPost (job, done) {
  debug('starting onepage crawler');
  var job_data = job,
      qcount = 0,
      scraping;

  var d;
  try {
      d = require('../def/' + job.job_name);
      d.defUri =  '../def/' + job.job_name;

  } catch (e) {
      console.log(e);
      debug('its possible the definition file for this job is absent. Check the def/ directory');
      throw e;
  }
  var scraper = require('../def/' + job_data.job_name).scraper;
  function _data(listing) {
      qcount++;
      debug('Listing found %d. Title is: %s', qcount, listing.title);
      // Check redis for this post.
      // the idea is, if (this post is
      // not found in redis) && (its found
      // and listing.title === post.title
      // ), its a new post.
      // and you can post a new facebook,
      // email, tweet....
      // then you need to save it as the
      // "current post".
      //
      // kill or stop osmosis.. this operation
      // is over.
      //    else
      // if its found, thats because, its old
      // do nothing
      client.get('ixit-current-post', function (err, post) {
        if (err) {
          return done(err);
        }
        // we found something, lets check if its old
        if (post && post === listing.title) {
          // just return false
          return done(false);
        }
          //overkill
        if (post && post !== listing.title) {
          // overkill
          done(listing);
          client.expire('ixit-current-post', 2 * 60);
          return client.set('ixit-current-post', listing.title);
        }
        // if its not found, its new
        if (!post) {
          done(listing);
          client.expire('ixit-current-post', 2 * 60);
          return client.set('ixit-current-post', listing.title);
        }

        // the default
        scraping.stop();
        done(false);
      });
  }

  //start scraper
  scraping = scraper(osmosis, _data, job_data);
}

function tweetAsPost (post) {
  var Tweet =  require('./share');
  var tweet = new Tweet(post.title, post.body);
  tweet.tweet(post);

}





module.exports = {
  queue: queue,
  tweetAsPost: tweetAsPost,
  uploadWhileCrawling : uploadWhileCrawling,
  uploadOneFile: uploadOneFile,
  latestPost: latestPost,
  defineJobs : defineJobs,
  onePageCrawl : onePageCrawl
};



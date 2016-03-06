var
    kue = require('kue'),
    queue = kue.createQueue(),
    request = require('request'),
    Models = require('./model'),
    _ = require('lodash'),
    debug = require('debug')('xixitbot:runner'),
    counter_debug = require('debug')('xixitbot:counter'),
    JSONStream = require('JSONStream'),
    es = require('event-stream'),
    xray = require('x-ray');



function startXRay (job) {
  debug('starting xray');
  var x = xray(),
      count = 0,
      job_data = job.data;
  var resultStream = x(job_data.proceed_from_url,
      job_data.job_record.scope,
      job_data.schema)
      .limit(2)
      .paginate(job.paginate)
      .write();


  resultStream
  .pipe(JSONStream.parse('*'))
  .on('data', function (data) {
      // assuming this is going to fire for
      // every row in our collection, we need
      // to update our database with the row
      // count after we have totally sent th       em
      // to the Vault,
      queue.create('send to vault', data).save();
      count++;
      counter_debug(count);

  });
}


function startjob (job, done) {
  var jobData = job.data;
  debug('Running Job on: %s', jobData.job_name);
  var doc = Models.prepareInitialDocument(jobData);
  var save_doc = new Models();
  //An kue job right here, should include a function
  //that fetches the status of the job to be executed
  //per iteration and uses that to construct the task to
  //be carried out when ever that definition is used.
  //
  save_doc.findOrUpdateJobProgress(doc)
  .then(function (useThisD) {
    var preped = Models.prepareUpdatedDocument(useThisD, doc.schema);
    queue.create('start xray',
      preped,
      function () {
      })
    .save();
    done();
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
  debug(jobData);
  request({
    method: 'POST',
    url: process.env.VAULT_RESOURCE + '/upload/automate',
    body: jobData,
    json: true
  }, function (err, r, ixitFile) {
    if (!err) {
      jobData.no_of_records_saved = jobData.no_of_records_saved || 0 + 1;
      // queue.create('save progress to db', [ixitFile, jobData]).save();
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


queue.process('start job', startjob);
queue.process('start xray', startXRay);
queue.process('send to vault', sendToVault);
queue.process('save progress to db', updateJobCount);


module.exports = queue;



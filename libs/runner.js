var
    kue = require('kue'),
    queue = kue.createQueue(),
    request = require('request'),
    Models = require('./model'),
    utils = require('./utils'),
    debug = require('debug')('ixitbot:runner'),
    JSONStream = require('JSONStream'),
    es = require('event-stream'),
    xray = require('x-ray');



function startXRay (job) {
  debug('starting xray');
  var x = xray(),
      count = 0,
      job_data = job.data;
      console.log(job_data.job_record);
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
      debug(count);
      // utils.debounce(function () {
      //    job_data.no_of_records_saved = job_data.no_of_records_saved + count;
      //    queue.create('save progress to db', job_data).save();
      //    count = 0;
      //  },10000);
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
  // jobData.owner = jobData.job_record.job_name || 'www-anon';
  // debug(job);
  debug(jobData);
  request({
    method: 'POST',
    url: process.env.VAULT_RESOURCE + '/upload/automate',
    body: jobData,
    json: true
  }, function (err, r, ixitFile) {
    debug(ixitFile);
    done();
  });
}

function updateJobCount (job, done) {
  var new_model = new Models();
  var jobData = job.data;
  new_model.findOrUpdateJobProgress(jobData.job_record, {
    no_of_records_saved: jobData.no_of_records_saved
  })
  .then(function () {
    done();
  });
}


queue.process('start job', startjob);
queue.process('start xray', startXRay);
queue.process('send to vault', sendToVault);
queue.process('save progress to db', updateJobCount);


module.exports = queue;



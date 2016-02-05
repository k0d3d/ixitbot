var
    kue = require('kue'),
    queue = kue.createQueue(),
    request = require('request'),
    Models = require('./model'),
    JSONStream = require('JSONStream'),
    es = require('event-stream'),
    Xray = require('x-ray');



function startXRay (job) {
  console.log('starting xray');
  var x = Xray(),
      count = 0,
      job_data = job.data;
  var resultStream = x(job_data.proceed_from_url,
      job_data.job_record.scope,
      job_data.schema)
      .limit(1)
      .paginate(job.paginate)
      .write();
      // (function(err, arr) {
      //   for (var i = 0; i < arr.length; i++) {
      //     agenda.now('send to vault', arr[i]);
      //   }
      //   done();
      // });

  resultStream
  .pipe(JSONStream.parse('*'))
  .on('data', function (data) {
      // assuming this is going to fire for
      // every row in our collection, we need
      // to update our database with the row
      // count after we have totally sent them
      // to the Vault,
      if (count < 2) {
        queue.create('send to vault', data).save();
      }
      count++;
  });
  // .pipe(es.mapSync(function (data) {
  //     console.log(data);
  // }));
  // done();
}


function startjob (job, done) {
  var jobData = job.data;
  console.log('Running Job on: %s', jobData.job_name);
  var doc = Models.prepareInitialDocument(jobData);
  var save_doc = new Models();
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

function sendToVault (job, done) {

  var jobData = job.data;
  // console.log(job);
  // console.log(jobData);
  request({
    method: 'POST',
    url: process.env.VAULT_RESOURCE + '/upload/automate',
    body: jobData,
    json: true
  }, function (err, r, ixitFile) {
    console.log(err);
    console.log(ixitFile);
    done();
  });
}

queue.process('start job', startjob);
queue.process('start xray', startXRay);
queue.process('send to vault', sendToVault);


module.exports = queue;



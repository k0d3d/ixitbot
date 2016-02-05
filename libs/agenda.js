var Agenda = require('agenda'),
    request = require('request'),
    Models = require('./model'),
    JSONStream = require('JSONStream'),
    es = require('event-stream'),
    Xray = require('x-ray');
var mongoConnectionString = "mongodb://127.0.0.1/bot";

var agenda = new Agenda({
  db: {
    address: mongoConnectionString
  },
  processEvery: '10 seconds'
});


function startXRay (job) {
  console.log('starting xray');
  var x = Xray(),
      count = 0,
      job_data = job.attrs.data;
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

      agenda.now('send to vault', data);
      count++;
  })
  // .pipe(es.mapSync(function (data) {
  //     console.log(data);
  // }));
  // done();
}


function startjob (job, done) {
  var jobData = job.attrs.data;
  console.log('Running Job on: %s', jobData.job_name);
  var doc = Models.prepareInitialDocument(jobData);
  var save_doc = new Models();
  save_doc.findOrUpdateJobProgress(doc)
  .then(function (useThisD) {
    var preped = Models.prepareUpdatedDocument(useThisD, doc.schema);
    agenda.now('start xray',
      preped,
      function () {
      });
    done();
  });
}

function sendToVault (job, done) {
  var jobData = job.attrs.data;
  request({
    method: 'POST',
    url: process.env.VAULT_RESOURCE + '/uploads/automate',
    data: jobData,
    json: true
  }, function (err, r, ixitFile) {
    console.log(err);
    console.log(ixitFile);
    done();
  });
}


agenda.define('start xray', startXRay);

agenda.define('start job', startjob);

agenda.define('send to vault', sendToVault);

module.exports.agenda = agenda;
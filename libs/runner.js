var
    kue = require('kue'),
    queue = kue.createQueue(),
    request = require('request'),
    Models = require('./model'),
    JSONStream = require('JSONStream'),
    es = require('event-stream'),
    Xray = require('x-ray');

function debounce(func, wait, options) {
      var args,
          maxTimeoutId,
          result,
          stamp,
          thisArg,
          timeoutId,
          trailingCall,
          lastCalled = 0,
          leading = false,
          maxWait = false,
          trailing = true;

      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      wait = toNumber(wait) || 0;
      if (isObject(options)) {
        leading = !!options.leading;
        maxWait = 'maxWait' in options && nativeMax(toNumber(options.maxWait) || 0, wait);
        trailing = 'trailing' in options ? !!options.trailing : trailing;
      }

      function cancel() {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (maxTimeoutId) {
          clearTimeout(maxTimeoutId);
        }
        lastCalled = 0;
        args = maxTimeoutId = thisArg = timeoutId = trailingCall = undefined;
      }

      function complete(isCalled, id) {
        if (id) {
          clearTimeout(id);
        }
        maxTimeoutId = timeoutId = trailingCall = undefined;
        if (isCalled) {
          lastCalled = now();
          result = func.apply(thisArg, args);
          if (!timeoutId && !maxTimeoutId) {
            args = thisArg = undefined;
          }
        }
      }

      function delayed() {
        var remaining = wait - (now() - stamp);
        if (remaining <= 0 || remaining > wait) {
          complete(trailingCall, maxTimeoutId);
        } else {
          timeoutId = setTimeout(delayed, remaining);
        }
      }

      function flush() {
        if ((timeoutId && trailingCall) || (maxTimeoutId && trailing)) {
          result = func.apply(thisArg, args);
        }
        cancel();
        return result;
      }

      function maxDelayed() {
        complete(trailing, timeoutId);
      }

      function debounced() {
        args = arguments;
        stamp = now();
        thisArg = this;
        trailingCall = trailing && (timeoutId || !leading);

        if (maxWait === false) {
          var leadingCall = leading && !timeoutId;
        } else {
          if (!maxTimeoutId && !leading) {
            lastCalled = stamp;
          }
          var remaining = maxWait - (stamp - lastCalled),
              isCalled = remaining <= 0 || remaining > maxWait;

          if (isCalled) {
            if (maxTimeoutId) {
              maxTimeoutId = clearTimeout(maxTimeoutId);
            }
            lastCalled = stamp;
            result = func.apply(thisArg, args);
          }
          else if (!maxTimeoutId) {
            maxTimeoutId = setTimeout(maxDelayed, remaining);
          }
        }
        if (isCalled && timeoutId) {
          timeoutId = clearTimeout(timeoutId);
        }
        else if (!timeoutId && wait !== maxWait) {
          timeoutId = setTimeout(delayed, wait);
        }
        if (leadingCall) {
          isCalled = true;
          result = func.apply(thisArg, args);
        }
        if (isCalled && !timeoutId && !maxTimeoutId) {
          args = thisArg = undefined;
        }
        return result;
      }
      debounced.cancel = cancel;
      debounced.flush = flush;
      return debounced;
}

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
      queue.create('send to vault', data).save();
      count++;
      // debounce(function () {
      //   console.log('being saved');
        console.log(count);
      //   job_data.no_of_records_saved = job_data.no_of_records_saved + count;
      //   queue.create('save progress to db', job_data).save();
      //   count = 0;
      // },10000);
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

  var jobData = job.data;
  // console.log(job);
  // console.log(jobData);
  request({
    method: 'POST',
    url: process.env.VAULT_RESOURCE + '/upload/automate',
    body: jobData,
    json: true
  }, function (err, r, ixitFile) {
    console.log(ixitFile);
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



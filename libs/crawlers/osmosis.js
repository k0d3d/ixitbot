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


module.exports = startOsmosis;
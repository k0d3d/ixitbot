var Schema = require('./schema/index'),
    Base = require('./base.js'),
    debug = require('debug')('ixitbot:models'),
    Q = require('q');

var redis = require("redis");
var client = redis.createClient({
  detect_buffers: true,
  url: process.env.REDIS_URL
});

/**
 * standard crud class I guesss.
 * @param {[type]} job_name     [Definition]
 * @param {[type]} starting_url [Definition]
 */
var MainClass = function MainClass () {
  Base.call(this);
};

MainClass.prototype = Object.create(Base.prototype);

MainClass.prototype.constructor = MainClass;

/**
 *
 * basically returns an object /document
 * you can save as a new 'job progress'
 * @param {[type]} job_name [description]
 */
MainClass.prepareInitialDocument = function prepareInitialDocument (card) {
    var updateDocument = {};
    var q = Q.defer();




    if (!card) {
        throw new Error ('Job not found. Check job_name .json');
    }

    updateDocument.statusLog = {
        status_date: Date.now(),
        status: 'active',
        no_of_records: 0
    };

    client.get(card.job_name + '_last_url', function (err, url) {
      if (err && err instanceof Error) {
        throw err;
      }
      if (url) {
         updateDocument.proceed_from_url = url;
      } else {
         updateDocument.proceed_from_url = card.starting_url;
      }

      updateDocument['job_record.job_name'] = card.job_name;
      updateDocument['job_record.scope'] = card.scope;
      updateDocument['job_record.limit'] = card.limit;
      updateDocument.current_status = 'active';
      updateDocument.no_of_records_saved = 0;
      updateDocument.paginate = card.paginate;
      updateDocument.scope = card.scope;
      updateDocument.schema = card.schema;
      return q.resolve(updateDocument);

    });
      return q.promise;
};

MainClass.prepareUpdatedDocument = function prepareUpdatedDocument (d, schema) {
  d = d.toObject();
  d.schema = schema;
  delete d._id;
  delete d.__v;
  // console.log(d);
  return d;
};

/**
 * updates a job progress. This method performs
 * 3 important operations. It can locate and return
 * a job progress record, It updates the status
 * of the job and returns the result of the update.
 * it also records a log of what was updated.
 * @param  {[type]} doc a criteria to find the record
 * @param  {[type]} changes a document to update the record
 * @return {[type]}     [Definition]
 */
MainClass.prototype.findOrUpdateJobProgress = function findOrUpdateJobProgress (doc, changes) {
  var q = Q.defer(),
      updateDoc = {} ;

  Schema.JobProgress
  .findOne({
    'starting_url': doc.starting_url,
    'job_name': doc.job_name
  })
  .exec(function (err, found) {
    if (err) {
      return q.reject(err);
    }
    //update
    if (found && changes)  {
      found.status_log.push(changes.statusLog);
      for (var p in changes) {
        if (changes.hasOwnProperty(p) && p !== 'statusLog') {
          found[p] = changes[p];
        }
      }
      found.save(function (err, updated) {
        if (err) {
          return q.reject(err);
        }
        return q.resolve(updated);
      });
    }
    // no updates
    if (found && !changes) {
      return q.resolve(found);
    }
    //create a new doc,
    //if not found
    if (!found) {
      for (var prop in doc) {
        if (doc.hasOwnProperty(prop) && prop !== 'statusLog') {
          updateDoc[prop] = doc[prop];
        }
      }

      var jp = new Schema.JobProgress(updateDoc);
      if (doc.statusLog) {
        jp.status_log = [doc.statusLog];
      }
      jp.save(function (err, saved) {
        if (err) {
          return q.reject(err);
        }
        return q.resolve(saved);
      });
    }
  });
  return q.promise;
};


/**
 * removes a job Definition from the application.
 * @return {[type]} [Definition]
 */
MainClass.prototype.removeDefinition = function removeDefinition(id) {
  var q = Q.defer(),
      criteria = {};
  if (id) {
    criteria._id = id;
  } else {
    criteria._id = this.jobId;
  }
  Schema.JobDefinition
  .remove(criteria)
  .exec(function (err, done) {
    if (err) {
      return q.reject(err);
    }
    return q.resolve(done);
  });

  return q.promise;
};

/**
 * removes a job Definition from the application.
 * @return {[type]} [Definition]
 */
MainClass.prototype.removeJobProgress = function removeJobProgress(id) {
  var q = Q.defer(),
      self = this,
      criteria = {};

  if (id) {
    criteria._id = id;
  } else {
    criteria._id = this.jobId;
  }

  Schema.JobDefinition
  .remove(criteria)
  .exec(function (err, done) {
    if (err) {
      return q.reject(err);
    }
    return q.resolve(done);
  });

  return q.promise;
};

/**
 * adds a new job Definition. This tells the application
 * what site to crawl through and how to behave when crawling.
 *
 * @param {[type]} options Instructions no how to behave when
 * crawling this site.
 */
MainClass.prototype.addJobDefinition = function addJobDefinition (options) {
  var q = Q.defer(),
      self = this;

  var describe = new Schema.JobDefinition();
  describe.job_name = self.job_name;
  describe.starting_url = self.starting_url;
  if (options) {
    for (var key in options ) {
      if(options.hasOwnProperty(key)) {
        describe[key] =options[key];
      }
    }
  }
  describe.save(function (err, i) {
    if (err) {
      return q.reject(err);
    }
    //keep it safe
    self.setId(i._id);
    return q.resolve(i);
  });



  return q.promise;
};

/**
 * return the records
 * @param  {[type]} options [Definition]
 * @return {[type]}         [Definition]
 */
MainClass.prototype.listJobDefinition = function listJobDefinition (options) {
  var q = Q.defer();

  Schema.JobDefinition
  .find(options)
  .exec(function (err, docs) {
    if (err) {
      return q.reject(err);
    }
    return q.resolve(docs);
  });
  return q.promise;
};

/**
 * return the records
 * @param  {[type]} options [Definition]
 * @return {[type]}         [Definition]
 */
MainClass.prototype.listJobProgress = function listJobProgress (options) {
  var q = Q.defer();

  Schema.JobProgress
  .find(options)
  .exec(function (err, docs) {
    if (err) {
      return q.reject(err);
    }
    return q.resolve(docs);
  });
  return q.promise;
};

MainClass.prototype.saveFileMeta = function saveFileMeta(fileData, jobData) {
  var q = Q.defer();

  var newFile = new Schema.File();
  newFile.identifier =  fileData.identifier;
  newFile.mediaNumber = fileData.mediaNumber;
  newFile.jobId =   jobData._id;
  newFile.title =  jobData.title || jobData.filename;
  newFile.targetSrc =  jobData.targetSrc;
  newFile.save(function (err, saved) {
    if (err) {
      return q.reject(err);
    }
    return q.resolve(saved);
  });
  return q.promise;
};

MainClass.prototype.toString = function toString () {
  return 'MainClass';
};


module.exports = MainClass;
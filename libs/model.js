var Schema = require('./schema/index'),
    Q = require('q');


/**
 * standard crud class I guesss. if the constructor
 * is called with arguments, a new instance is created
 * and returned. if the contructor is called without
 * arguments, the existing instance is returned
 * or an error thrown.
 * @param {[type]} job_name     [Definition]
 * @param {[type]} starting_url [Definition]
 */
var MainClass = (function MainClass () {
  // this.jobId = '';
  "use strict";


  var instance;

  //else lets return what ever instance we can find
  //if arguments are not passed in.
  function One_Stance (job_name, starting_url) {
    //if arguments are passed in, overide the this values
    //so we can setup a new instance.
    if (job_name) {
      this.job_name = job_name;
    }
    if(starting_url) {
      this.starting_url = starting_url;
    }

    this.setId = function setId (id) {
      this.jobId = id;
    };

    if (instance) {
      return instance;
    }
    instance = this;
    return this;
  }

  One_Stance.getInstance = function () {
    return instance || new One_Stance();
  };

  return One_Stance;
})();


MainClass.prototype.constructor = MainClass;

/**
 *
 * basically returns an object /document
 * you can save as a new 'job progress'
 * @param {[type]} job_name [description]
 */
MainClass.jobaway = function jobaway (job_name) {
    var updateDocument = {};
    if (job_name) {
        //show help
    }
    //read config file
    //this could also fetch
    //definitions from a database
    var job_def_collection = {};
    try {
      job_def_collection = require('../jobdef.json');
    } catch(e) {
      console.log('Error opening file: jobdef.json');
      throw e;
    }

    var card = job_def_collection[job_name];

    if (!card) {
        throw new Error ('Job not found. Check jobdef.json');
    }

    updateDocument.statusLog = {
        status_date: Date.now(),
        status: 'active',
        no_of_records: 0
    }

    updateDocument['job_record.job_name'] = card.job_name;
    updateDocument['job_record.scope'] = card.scope;
    updateDocument['job_record.limit'] = card.limit;
    updateDocument.current_status = 'active';
    updateDocument.no_of_records_saved = 0;
    updateDocument.proceed_from_url = card.starting_url;
    updateDocument.schema = card.schema;
    return updateDocument;
}

/**
 * updates a job progress. This method performs
 * 3 important operations. It can locate and return
 * a job progress record, It updates the status
 * of the job and returns the result of the update.
 * it also records a log of what was updated.
 * @param  {[type]} id Supply an Id to locate a record
 * @param  {[type]} doc a document to update the record
 * @return {[type]}     [Definition]
 */
MainClass.prototype.findOrUpdateJobProgress = function findOrUpdateJobProgress (id,doc) {
  var q = Q.defer(),
      self = this,
      updateDoc = {} ;
      updateDoc.$set = {};

  Schema.JobProgress
  .findOne({
    '_id': id
  })
  .exec(function (err, found) {
    if (err) {
      return q.reject(err);
    }
    //no need to update
    if (found)  {
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
        console.log(err, saved);
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

MainClass.prototype.toString = function toString () {
  return "MainClass";
};


module.exports = MainClass;
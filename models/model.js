var Schema = require('./schema/index'),
    Q = require('q');


/**
 * standard crud class I guesss. if the constructor
 * is called with arguments, a new instance is created
 * and returned. if the contructor is called without
 * arguments, the existing instance is returned
 * or an error thrown.
 * @param {[type]} job_name     [description]
 * @param {[type]} starting_url [description]
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
 * updates a job progress. This method performs
 * two important operations. It updates the status
 * of the job and returns the result of the update.
 * it also records a log of what was updated.
 * @param  {[type]} doc [description]
 * @return {[type]}     [description]
 */
MainClass.prototype.updateJobProgress = function updateJobProgress (doc) {
  var q = Q.defer(),
      self = this,
      updateDoc = {} ;

  if (doc.statusLog) {
    updateDoc.$push = {
      status_log: doc.statusLog
    };
  }
  for (var prop in doc) {
    if (doc.hasOwnProperty(prop) && doc[prop] !== 'statusLog') {
      updateDoc.$set[prop] = doc[prop];
    }
  }


  Schema.JobProgress
  .update({
    _id: this.jobId
  }, updateDoc,
  {upsert: true})
  .exec(function (err, i) {
    if (err) {
      return q.reject(err);
    }
    return q.resolve(i);
  });

  return q.promise;
};


/**
 * removes a job description from the application.
 * @return {[type]} [description]
 */
MainClass.prototype.removeDescription = function removeDescription(id) {
  var q = Q.defer(),
      self = this,
      criteria = {};
  if (id) {
    criteria._id = id;
  } else {
    criteria._id = this.jobId;
  }
  Schema.JobDescription
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
 * removes a job description from the application.
 * @return {[type]} [description]
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

  Schema.JobDescription
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
 * adds a new job description. This tells the application
 * what site to crawl through and how to behave when crawling.
 *
 * @param {[type]} options Instructions no how to behave when
 * crawling this site.
 */
MainClass.prototype.addJobDescription = function addJobDescription (options) {
  var q = Q.defer(),
      self = this;

  var describe = new Schema.JobDescription();
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
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
MainClass.prototype.listJobDescription = function listJobDescription (options) {
  var q = Q.defer();

  Schema.JobDescription
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
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
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
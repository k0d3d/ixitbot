var mongoose = require('mongoose'),
    Schema = require('mongoose').Schema;

/**
 * This schema primarily states what a job
 * should do when its executed. Each job should
 * clearly define these required fields .
 * label. Each schema
 * field has comments on top where necessary.
 */
var JobDescriptionSchema = new Schema ({
  //something that makes sense to you.d
  job_name : {type: String, required: true},
  starting_url: {type: String, required: true},
  //You can also supply a scope to each selector.
  //In jQuery, this would look something like
  //this: $(scope).find(selector).
  scope: {type: String},
  //provide a selector for the title, just a title,
  title: {type: String},
  //a selector a thumbnail or we'll pick one from
  //the favicon or site meta
  thumbnail: {type: String},
  // no of records to process before stopping.
  limit: {type: Number}
});

/**
 * Keeps a record of the jobs created on
 * the bot. Queries for active, suspended,
 * paused or different job states can be
 * executed on the records created from
 * this schema.
 * @type {Schema}
 */
var JobProgressSchema = new Schema ({

  job_record: JobDescriptionSchema,
  date_created: {type: Date, default: Date.now},
  date_completed: {type: Date},
  current_status: {type: String},
  status_log: [{
    status_date: {type: Date},
    status: {type: String},
    no_of_records: {type: Number}
  }],
  no_of_records_saved: {type: Number},
  //this should be the last url
  //processed by the no_of_records
  //saved
  proceed_from_url: {type: String}
});

mongoose.model('progress', JobProgressSchema);
mongoose.model('description', JobDescriptionSchema);
module.exports.JobProgress = mongoose.model('progress');
module.exports.JobDescription = mongoose.model('description');
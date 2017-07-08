var mongoose = require('mongoose'),
    Schema = require('mongoose').Schema;

/**
 * moongoose schema for MongoDB 
 * documents
*/
/**
 * This schema primarily states what a job
 * should do when its executed. Each job should
 * clearly define these required fields .
 * label. Each schema
 * field has comments on top where necessary.
 */
var JobDefinitionSchema = new Schema ({
  //something that makes sense to you.d
  job_name : {type: String, required: true},
  //You can also supply a scope to each selector.
  //In jQuery, this would look something like
  //this: $(scope).find(selector).
  scope: {type: String},
  // no of records to process before stopping.
  limit: {type: Number},
  bot_schema:{type: Schema.Types.Mixed}
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

  job_record: JobDefinitionSchema,
  date_created: {type: Date, default: Date.now},
  date_completed: {type: Date},
  current_status: {type: String},
  status_log: [{
    status_date: {type: Date},
    status: {type: String},
    no_of_records: {type: Number}
  }],
  no_of_records_saved: {type: Number, default: 0},
  page_so_far: {type: Number},
  scope: {type: String},
  //this should be the last url
  //processed by the no_of_records
  //saved
  proceed_from_url: {type: String},
  last_crawled_url: {type: String}
});



mongoose.model('progress', JobProgressSchema);
mongoose.model('Definition', JobDefinitionSchema);
module.exports.JobProgress = mongoose.model('progress');
module.exports.JobDefinition = mongoose.model('Definition');
module.exports.File = require('./index.js');
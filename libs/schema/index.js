var mongoose = require('mongoose');
var mongoosastic=require("mongoosastic"),
    url = require('url'),
    Schema = require('mongoose').Schema;

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

var FileMetaSchema = new Schema ({
  // identifier: string that identifies this download
  // on ixits vault
  identifier: {type: String},
  // mediaNUmber: Number that identifies.......
  mediaNumber: {type: Number},
  // jobId: relative _id of the job that created this
  jobId:  {type: Schema.ObjectId, ref: 'JobProgressSchema'},
  // title: the title for this job/page can be used as a filename
  title: {type: String,  es_indexed:true },
  // targetSrc: the link that returns an actual download
  targetSrc: {type: String},
  // url: this has to be the url where the file download
  // and meta data is found
  url: {type: String,  es_indexed:true },
  // props: should contain meta information.
  // because scraped data is inconsistent.
  // file properties which can be retrieved from
  // the page like, date uploaded, author, filename
  // etc. or even the redirect paths
  props: {type:[Schema.Types.Mixed], es_indexed:true}
});


if (!process.env.ELASTICSEARCH_URL) {
  throw new Error('missing env var ELASTICSEARCH_URL');
}
var ELASTICSEARCH_URL = url.parse(process.env.ELASTICSEARCH_URL);
FileMetaSchema.plugin(mongoosastic, {
  host: ELASTICSEARCH_URL.hostname,
  port: ELASTICSEARCH_URL.port,
  protocol: ELASTICSEARCH_URL.protocol,
  auth: ELASTICSEARCH_URL.auth

});

mongoose.model('progress', JobProgressSchema);
mongoose.model('Definition', JobDefinitionSchema);
mongoose.model('file', FileMetaSchema);
module.exports.JobProgress = mongoose.model('progress');
module.exports.JobDefinition = mongoose.model('Definition');
module.exports.File = mongoose.model('file');
var mongoose = require('mongoose');
var mongoosastic=require("mongoosastic"),
    url = require('url'),
    Schema = require('mongoose').Schema;

var FileMetaSchema = new Schema ({
  // identifier: string that identifies this download
  // on isas
  identifier: {type: String},
  // mediaNUmber: the media number for this FileMeta
  // on isas.media documents
  mediaNumber: {type: Number},
  // jobId: relative _id of the job that created this
  jobId:  {type: Schema.ObjectId, ref: 'JobProgressSchema'},
  // title: the title for this job/page can be used as a filename
  title: {type: String,  es_indexed:true },
  // targetSrc: the link that returns an actual download
  targetSrc: {type: String,  es_indexed:true },
  // url: this has to be the url where the file download
  // and meta data is found
  url: {type: String,  es_indexed:true },
  date_created: {type: Date, default: Date.now, es_indexed:true},
  // props: should contain meta information.
  // because scraped data is inconsistent.
  // file properties which can be retrieved from
  // the page like, date uploaded, author, filename
  // etc. or even the redirect paths
  props: {
    type: Schema.Types.Mixed,
    es_indexed:true,
    es_type: 'nested',
    es_include_in_parent: true
  }
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

mongoose.model('file', FileMetaSchema);
module.exports = mongoose.model('file');
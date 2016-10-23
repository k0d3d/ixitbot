
var redis = require('redis');
var client = redis.createClient({
  detect_buffers: true,
  url: process.env.REDIS_URL
});
var
    Models = require('../model'),
    debug = require('debug')('ixitbot:runner');
var errors = require('common-errors');

const roboto = require('roboto');
// const html_strip = require('htmlstrip-native').html_strip;

// var stripOptions = {
//   include_script : false,
//   include_style : false,
//   compact_whitespace : true
// };

module.exports = function (job, done) {
    var job_data = job.data;
        job_data.scraper = require('../../def/' + job_data.job_record.job_name).scraper;
    
    let crawler = new roboto.Crawler({
      startUrls: [
        // "http://tooxclusive.com",
        'http://naijaloaded.com',
        'http://notjustok.com',
      ],
      allowedDomains: [
        // "tooxclusive.com",
        'naijaloaded.com',
        'notjustok.com'
      ],
      // Note that there is a delay due to directive 'Crawl-Delay: 30'
      // defined in their robots.txt
      obeyRobotsTxt: false,
      obeyNoFollow: true
    });
    
    crawler.parseField('url', function(response) {
      return response.url;
    });
    
    crawler.parseField('title', function(response, $) {
      return $('head title').text();
    });
    
    crawler.parseField('text', function(response, $) {
      return $('.content').text();
    
    });
    
    crawler.parseField('props', function(response, $) {
        return {
                    'imageSrc' : $('img.alignnone').attr('src')
                  }
    });
    
    crawler.parseField('targetSrc', function(response, $) {
      return $("a[href*='.mp3'], a[href*='.mp4']").attr('href');
    });
    
    crawler.on('item', function(item) {
        
      // Do something with the item!
      // set the proper object and properties which 
    //    the rest of the application requires as a 
        // a response.
        if (item.targetSrc && typeof item.targetSrc === 'string' ) {
            
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
              new_model.saveFileMeta(item, job_data)
              .then(function () {
                debug('saved and updated including file meta');
                done();
              }, function (err) {
                console.log(err);
                console.log('we got an error');
                done(new errors.Error(err));
              });
            });
        }
    });
    
    crawler.crawl();
    
}


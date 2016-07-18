describe('A Http server to listen to incoming connections', function () {
  var expect = require('chai').expect;
  var rewire = require('rewire');
  var HTTP = rewire('../http'),
    request = require('request');



  beforeEach(function () {
    HTTP.__set__('RunnerMofo.onePageCrawl', function onePageCrawl (c, cb) {
      var ci = require('./crawled_item.json');
      cb(ci);
    });
  });

  it ('should properlly listen for connections when the server is connected', function (done) {

      HTTP.then(function () {
        request.get({
          url: 'http://localhost:' + process.env.IASS_HTTP_PORT
        }, function (err) {
          expect(err).to.equal(null);
          done();
        });
      });

  }, 10000);

  it('should make a successful request to the new feed item endpoint', function () {
    HTTP.then(function () {
      request.post({
        url: 'http://localhost:' + process.env.IASS_HTTP_PORT + '/newpost/tooexclusive/rss',
        body: {
          EntryTitle: 'X-Jay Ft. Zafi &#8211; Baba Loke',
          // EntryUrl: 'http://www.naijaloaded.com.ng/wp-content/uploads/2016/04/X-Jay-Baba-Loke-ft-Zafi-master.mp3',
          EntryUrl: 'http://www.naijaloaded.com.ng/2016/04/12/music-x-jay-ft-zafi-baba-loke/',
          EntryAuthor: 'Makinde',
          EntryContent: '<p>The post <a rel="nofollow" href="http://www.naijaloaded.com.ng/2016/04/12/music-x-jay-ft-zafi-baba-loke/">[Music] X-Jay Ft. Zafi &#8211; Baba Loke</a> appeared first on <a rel="nofollow" href="http://www.naijaloaded.com.ng">Naijaloaded | Nigeria No. 1 Online Portal</a>.</p>',
          EntryImageUrl: 'http://778819914.r.worldcdn.net/wp-content/uploads/2016/04/2997602_heroa-1.jpg',
          EntryPublished: 'Tue, 12 Apr 2016 21:43:12 +0000'
        },
        json: true
      }, function (err, resp) {
        console.log('nonsense');
          expect(resp.statusCode).to.equal(200).and.not.above(210);
          done();
        });
    });
  }, 10000);
});
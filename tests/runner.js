describe('Runner contains functions which are run with jobs', function() {
  // var rewire = require('rewire');
  var runner = require('../libs/runner');
  var expect = require('chai').expect;


  it('should send an item to the ISAS', function (done) {
    var j = require('./crawled_item.json');
    runner.uploadOneFile(j, function (ixitFile) {
      if (typeof ixitFile === 'string') {
        ixitFile = JSON.parse(ixitFile);
      }
      // expect(false).to.be.true;``
      // expect(ixitFile.mediaNumber).to.be.ok;
      expect(ixitFile.error).to.be.undefined;
      var er_name = (ixitFile.name && ixitFile.name.toLowerCase().indexOf('error') > 1) ? undefined: true;
      expect(er_name).to.be.undefined;
      done();
    });
  }, 10000);
});
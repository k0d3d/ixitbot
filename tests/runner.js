describe('Runner contains functions which are run with jobs', function() {
  var rewire = require('rewire');
  var runner = rewire('../libs/runner');
  var expect = require('chai').expect;

  beforeEach(function () {

  })
  it('should send an item to the ISAS', function (done) {
    var j = {
      targetPageUrl: 'http://tooxclusive.com/audio/emmcee-rnb-blessings-ft-jake-chowman-kaptain-oteaz/',
      props: {
        mainImage: 'http://net.tooxclusive.com/wp-content/uploads/2016/04/EmmCee-RNB_Blessings-art-cover.jpg',
        targetSrcString: 'EmmCee RNB – “Blessings” ft. Jake Chowman, Kaptain, Oteaz'
      },
      title: 'EmmCee RNB – “Blessings” ft. Jake Chowman, Kaptain, Oteaz',
     targetSrc: 'http://net.tooxclusive.com/wp-content/uploads/2016/04/EmmCee-RNB-Blessings-Ft.-Jake-Chowman-Kaptain-Oteaz-Prod.-SongSmith.mp3',
     url: 'http://tooxclusive.com/audio/emmcee-rnb-blessings-ft-jake-chowman-kaptain-oteaz/',
     job_name : 'tooexclusive',
    starting_url : 'http://tooxclusive.com/main/audio/',
    proceed_from_url: 'http://tooxclusive.com/main/audio/'
    };
    runner.sendToVault(j, function (ixitFile) {
      expect(ixitFile).to.be.ok;
      expect(ixitFile.name).to.be.defined;
      done();
    });
  });
});
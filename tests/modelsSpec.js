describe('running test on models', function () {
  var stance = require('../index'),
      Model = require('../models/model');

  var sampleJob = {
    'job_name': 'iXIt',
    'starting_url' : 'http://www.i-x.it'
  };

  it('should add a new job description to the database', function (done) {
    stance
    .then(function () {
      var models =  new Model(sampleJob.job_name, sampleJob.starting_url);
      models.addJobDescription({
        title: 'Spider Bot is Here',
        limit: 5
      })
      .then(function (saved_document) {
        expect(saved_document._id).toBeDefined();
        sampleJob.id = saved_document._id;
        sampleJob.modelInstance = models;
        done();
      }, function (err) {
        fail(err);
      });
    });
  }, 20000);

  xit('should instantiate class with and without arguments', function (done) {
    var inA = new Model(sampleJob.job_name, sampleJob.starting_url);
    sampleJob.modelInstance = new Model();
    expect(inA).toBe(sampleJob.modelInstance);
  });


  it('should should remove a job description', function (done) {
    stance
    .then(function () {
      // console.log('db');
      var models = new Model();
      models.removeDescription(sampleJob.id)
      .then(function (status) {
        expect(status.result.ok).toBe(1);
        expect(status.result.n).toBe(1);
        done();
      });
    }, function (err) {
      fail(err);
    });
  }, 20000);
});
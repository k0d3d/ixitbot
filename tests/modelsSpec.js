describe('running test on models', function () {
  var stance = require('../index'),
      Model = require('../models/model');

  var sampleJob = {
    'job_name': 'iXIt',
    'starting_url' : 'http://www.i-x.it'
  };


  xit('should add a new job Definition to the database', function (done) {
    stance
    .then(function () {
      var models =  new Model(sampleJob.job_name, sampleJob.starting_url);
      models.addJobDefinition({
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

  it('should instantiate class with and without arguments', function (done) {
    var inA = new Model(sampleJob.job_name, sampleJob.starting_url);
    sampleJob.modelInstance = new Model();
    expect(inA).toBe(sampleJob.modelInstance);
  });

  it ('should add a new job to the processing queue', function (done) {
    stance
    .then(function () {
      // console.log('db');
      var models = new Model();
      models.findOrUpdateJobProgress(sampleJob.id)
      .then(function (status) {
        console.log(status);
        expect(status.result.ok).toBe(1);
        expect(status.result.n).toBe(1);
        done();
      });
    }, function (err) {
      fail(err);
    });
  }, 20000);

  xit('should should remove a job Definition', function (done) {
    stance
    .then(function () {
      // console.log('db');
      var models = new Model();
      models.removeDefinition(sampleJob.id)
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
describe('Checks all the logic and methods and conditions required for operation', function() {

  var should = require('should'),
      sinon = require('sinon'),
      mockery = require('mockery');

  var boot = require('../index');



  // var sandbox = sinon.sandbox.create(),
  //     stubbedDonut = {
  //         thatAPIMethod: sandbox.stub()
  //     },
  //     DonutQueue,
  //     donutQueue;

  describe('should properly require definition files', function() {

      // before(function() {
      //     mockery.enable(); // Enable mockery at the start of your test suite
      // });

      // beforeEach(function() {
      //     mockery.registerAllowable('async');                    // Allow some modules to be loaded normally
      //     mockery.registerMock('../lib/donut', stubbedDonut);    // Register others to be replaced with our stub
      //     mockery.registerAllowable('../lib/donut-queue', true); // Allow our module under test to be loaded normally as well
      //     DonutQueue = require('../lib/donut-queue');            // Load your module under test
      //     donutQueue = new DonutQueue();
      // });

      // afterEach(function() {
      //     sandbox.verifyAndRestore(); // Verify all Sinon mocks have been honored
      //     mockery.deregisterAll();    // Deregister all Mockery mocks from node's module cache
      // });

      // after(function() {
      //     mockery.disable(); // Disable Mockery after tests are completed
      // });

      describe('load file', function() {
          it('should load the correct definition files', function() {
              var expectedLen = donutQueue.length + 1;
              donutQueue.push(stubbedDonut);
              expect(donutQueue.length).to.equal(expectedLen);
          });
      });

  });
});


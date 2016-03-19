describe('it should define and construct classes inherited from the base object', function () {
	var Base = require('../libs/base.js');
	var Q = require('q');

	it('should create a new base object instance', function () {
		var base = new Base();
		expect(base instanceof Base).toBeTruthy();
		expect(base.before).toBeDefined();
		expect(base.after).toBeDefined();
	});

	it('should create hooks for sub classes', function() {
		// inherits from Rectangle
		function SubClass () { 
		    Base.call(this);
		}

		SubClass.prototype = Object.create(Base.prototype);
		var subclass = new SubClass(3);
		expect(subclass instanceof Base).toBeTruthy();
		expect(subclass.before).toBeDefined();
		expect(subclass.after).toBeDefined();
	});

	it('should execute before and after hooks registered to methods', function(done) {
		// inherits from Rectangle
		function SubClass () { 
		    Base.call(this);
		}

		function thenSayHowdy (count) {
			var q = Q.defer();
			count.no++;
			q.resolve(count);
			return q.promise;
		}

		function finish (l) {
			console.log(l, count);
			expect(l.no).toEqual(count.no);
			// expect(l.no).toEqual(3);
			done();			
		}

		SubClass.prototype = Object.create(Base.prototype);
		SubClass.prototype.sayhello = function (count) {
			var q = Q.defer();
			console.log('saying hello');
			count.no++;
			q.resolve(count);
			return q.promise;
		};
		var subclass = new SubClass();
		var count = { 
			'no' : 0
		};

		subclass.before('sayhello', thenSayHowdy, count);
		subclass.after('sayhello', thenSayHowdy, count);
		subclass.after('sayhello', finish, count);

		// subclass.pre('sayhello', function (next) {
		// 	thenSayHowdy(count)
		// 	.then(function () {
		// 		next();
		// 	});
		// });

		// Define a new method that is able to invoke pre and post middleware 
		// subclass.hook('sayhello', SubClass.prototype.sayhello);
		var s = subclass.sayhello(count);
		return;
		s.then(function (l) {
			console.log(l, count);
			expect(l.no).toEqual(count.no);
			// expect(l.no).toEqual(3);
			done();

		});


	}, 15000);
});
var hooks = require('hooks');

// a convenience function for parsing string namespaces and
// automatically generating nested namespaces
function extendAsNS( ns, ns_string ) {
    var parts = ns_string.split('.'),
        parent = ns,
        pl, i;

    if (parts[0] === 'Base') {
        parts = parts.slice(1);
    }

    pl = parts.length;
    for (i = 0; i < pl; i++) {
        //create a property if it doesnt exist
        if (typeof parent[parts[i]] === 'undefined') {
            parent[parts[i]] = {};
        }

        parent = parent[parts[i]];
    }

    return parent;
}

var BotBase = function BotBase () {
	var base = this;
	// var _base = {};
	// Add hooks' methods: `hook`, `pre`, and `post` 
	// this will hide the hooks as private properties
	for (var k in hooks) {
		// if (hooks.hasOwnProperty(k)) {
		  base[k] = hooks[k];
		// }
	}

	base.before = function (methodname) {
		if (!methodname) {
			throw new Error ('supply a existing method to hook into');
		}
		var cbFn, args = [];
		if (arguments.length > 1) {
			// we might have a callback function 
			cbFn = arguments[1];
			for (var i = 2; i < arguments.length; i++) {
				args.push(arguments[i]);
			}

		}
		base.pre(methodname, function (next) {
			// this will make sure , expecting our callback
			// is a promise, our hook can proceed to 
			// the next middleware in the chain.
			var e = cbFn.apply(base, args);
			e
			.then(function () {
				next();
			});
		});
	};
	base.after = function (methodname) {
		if (!methodname) {
			throw new Error ('supply a existing method to hook into');
		}
		var cbFn, args = [];
		if (arguments.length > 1) {
			// we might have a callback function 
			cbFn = arguments[1];
			for (var i = 2; i < arguments.length; i++) {
				args.push(arguments[i]);
			}

		}
		base.post(methodname, function (next) {
			// this will make sure , expecting our callback
			// is a promise, our hook can proceed to 
			// the next middleware in the chain.
			var e = cbFn.apply(base, args);
			e
			.then(function () {
				next();
			});
		});
	};

};

BotBase.prototype.constructor = BotBase;

module.exports = BotBase;
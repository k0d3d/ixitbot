
var appPkj = require('./package.json');
var InstigatorLOL = require('./index');
var RunnerMofo = require('./libs/runner');
var Schema = require('./libs/schema/index');
var ModelLogic = require('./libs/model');
var Hapi = require('hapi');
var errors = require('common-errors');
var Q = require('q');
var q = Q.defer();
// Create a server with a host and port
var debug = require('debug')('ixitbot:httpService');
var server = new Hapi.Server();

if (
  !process.env.IASS_HTTP_PORT ||
  !process.env.VAULT_RESOURCE) {
    throw new errors.ConnectionError('env var value unavailable');
}
server.connection({
    // host: 'localhost',
    port: process.env.IASS_HTTP_PORT
});

// Add the route


server.route({
    // TODO:: change to GET method,
    // change path, possible to include search string
    // or url parameter.
    method: 'GET',
    path: '/a/{songName}',
    handler: function (request, reply) {

        var _file = Schema.File;
        _file.search({
            query_string: {query: "star"}
        }, {
            hydrate:true
        }, function (e, docs) {
            debug(e. docs);
            reply(docs);
        })
    }

});

// Start the server
server.start(function (err) {

    if (err) {
        throw new errors.HttpStatusError(500, err);
    }
    debug('%s running at: %s', appPkj.name, process.env.IASS_HTTP_PORT);
    q.resolve(server);
});


module.exports = q.promise;
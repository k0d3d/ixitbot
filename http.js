
var appPkj = require('./package.json');
var InstigatorLOL = require('./index');
var Run = require('./libs/runner');
var Schema = require('./libs/schema/index');
var DataModel = require('./libs/model');
var Hashr = require('./libs/hash.js');
var Hapi = require('hapi');
var errors = require('common-errors');
var Q = require('q');
var q = Q.defer();
// Create a server with a host and port
var debug = require('debug')('ixitbot:httpService');
var server = new Hapi.Server();

if (
  !process.env.IASS_HTTP_PORT ||
  !process.env.IWAC_SHORT_URL ||
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
    path: '/search/{songName}',
    handler: function (request, reply) {

        var _file = Schema.File;
        _file.search({
            query_string: {query: request.params.songName}
        }, {
            hydrate:true
        }, function (e, docs) {
            debug(e. docs);
            reply(docs);
        });
    }

});

server.route({
    // This route will request a file
    // should be downloaded by isas.
    // This can happen when a user clicks
    // the a search result or widget.
    // The logic here is
    // - Request for the file, if its valid
    // - use the file data/properties to send isas
    // a download request so the actual binary data
    // is downloaded and saved on isas.
    // - expect a response from isas containing the
    // mediaNumber of the downloaded binary.
    method: 'GET',
    path: '/req-file',
    handler: function (request, reply) {

        if (request.query.fileId &&
            request.query.url) {
            // initiate a runner instance
            // call the method that request a file
            // download from isas.
            var model = new DataModel();
            model.findFileById(request.query.fileId)
            .then(function (file) {
                Run.uploadOneFile(file)
                .then(function (file_with_media_number) {
                    var hid = Hashr.hashInt(file_with_media_number.mediaNumber);
                    return reply.redirect(require('url').resolve(process.env.IWAC_SHORT_URL, hid));
                }, function (err) {
                    return reply(err);
                });

            });

        } else {
            reply(new errors.ConnectionError('unmet required query parameters'));
        }

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
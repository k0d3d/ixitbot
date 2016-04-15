
var appPkj = require('./package.json');
var InstigatorLOL = require('./index');
var RunnerMofo = require('./libs/runner');
var ModelLogic = require('./libs/model');
var Hapi = require('hapi');
var errors = require('common-errors');
var Q = require('q');
var q = Q.defer();
// Create a server with a host and port
var debug = require('debug')('ixitbot:httpService');
var server = new Hapi.Server();

if (!process.env.IASS_HTTP_PORT) {
    throw new errors.ConnectionError('IASS_HTTP_PORT value unavailable');
}
server.connection({
    host: 'localhost',
    port: process.env.IASS_HTTP_PORT
});

// Add the route


server.route({
    method: 'POST',
    path: '/newpost/{domainId}/rss',
    handler: function (request, reply) {
        //{{EntryTitle}} {{EntryUrl}} {{EntryAuthor}} {{EntryContent}} {{EntryImageUrl}} {{EntryPublished}}
        if (!request.payload.EntryUrl ||
            !request.payload.EntryAuthor) {
            return reply('EmptyPost');
        }
        var documentDefinition = {
          'job_name' : request.params.domainId,
          'proceed_from_url': request.payload.EntryUrl,
          'title': request.payload.EntryTitle,
          'props': {}
        };

        documentDefinition.props = {};
        for(var m in request.payload) {
            if (request.payload.hasOwnProperty(m)) {
                documentDefinition.props[m] = request.payload[m];
            }
        }
        debug(documentDefinition);
        var _logic = new ModelLogic();
        // _logic.after('saveFileMeta', RunnerMofo.tweetAsPost);
        // _logic.after
            RunnerMofo.onePageCrawl(documentDefinition, function (savedItem) {
                //saved item
                _logic.saveFileMeta(savedItem, documentDefinition)
                //send to vault
                .then(function () {
                    RunnerMofo.sendToVault(documentDefinition, function () {

                    })
                }, function (err) {
                    throw err;
                })
                .catch(function (e) {
                    console.log(e);
                    console.log(e.stack);
                });
                reply('Hello, ' + encodeURIComponent(request.params.name) + '!');
            });
        // InstigatorLOL.on('connected', function () {
        //     // RunnerMofo.queue.start(documentDefinition.job_name + 'peel a blog', documentDefinition);
        // });

    }
    // config: {
    //     validate: {
    //         params: {
    //             domainId: Joi.string().min(3).max(10)
    //         },
    //         payload: {
    //             '*': Joi.string()
    //         }
    //     }
    // }
});

// Start the server
server.start(function (err) {

    if (err) {
        throw new errors.HttpStatusError(500, err);
    }
    console.log('%s running at: %s', appPkj.name, process.env.IASS_HTTP_PORT);
    q.resolve(server);
});


module.exports = q.promise;
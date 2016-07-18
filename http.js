
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

if (
  !process.env.IASS_HTTP_PORT ||
  !process.env.VAULT_RESOURCE  ||
  !process.env.API_RESOURCE ) {
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
        var _logic = new ModelLogic();
        // _logic.after('saveFileMeta', RunnerMofo.tweetAsPost);
        InstigatorLOL.then(function () {
            debug('db one crawled_item');
            RunnerMofo.onePageCrawl(documentDefinition, function (crawled_item) {
                //saved item
                debug(crawled_item);
                RunnerMofo.uploadOneFile(crawled_item, function (ixit_file) {
                    return _logic.saveFileMeta(ixit_file, crawled_item)

                    //send to vault
                    //
                    .then(function () {
                      //get ixit link and tweet it
                      var hashr = require('./libs/hash');
                      RunnerMofo.tweetAsPost({
                        status: 'Download & Listen ' + crawled_item.title + '-> http://i-x.it/'+ hashr.hashInt(ixit_file.mediaNumber) +' #shareIxitLinks #followUsfastDownloadSpeeds'
                      });
                      reply(ixit_file.mediaNumber);
                    }, function (err) {
                        throw err;
                    })
                    .catch(function (e) {
                        console.log(e);
                        console.log(e.stack);
                    });
                });
            });
        });

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
    debug('%s running at: %s', appPkj.name, process.env.IASS_HTTP_PORT);
    q.resolve(server);
});


module.exports = q.promise;

var appPkj = require('./package.json');
var Hapi = require('hapi');

// Create a server with a host and port
var server = new Hapi.Server();
server.connection({
    host: 'localhost',
    port: 3350
});

// Add the route


server.route({
    method: 'POST',
    path: '/newpost/domainId/{domainId}/tag/{tag}',
    handler: function (request, reply) {
        reply('Hello, ' + encodeURIComponent(request.params.name) + '!');
    }
});

// Start the server
server.start(function (err) {

    if (err) {
        throw err;
    }
    console.log('%s running at: %s', appPkj.name, 3350);
});
describe('testing osmosis pulling data', function() {
  it("should correcly pull data from a website", function (done) {
    var osmosis = require('osmosis');
    var def = require('../def/lindaikeji.json'); // test schema file
    var util = require('util');

    osmosis
    .get(def.starting_url) //starting url
    .find(def.scope)
    .paginate(def.paginate, 2)
    .set(def.schema[0])
    .then(function (context, data, next) {
        data.url = context.doc().request.url;
        next(context, data);
    })
    .data(function(listing) {
        console.log(listing);
        util.inspect(listing, {colors:true});
        // do something with listing data
        expect(listing.length).toBeGreaterThan(1);
        done();
    })
    .log(console.log)
    .error(console.log)
    .debug(console.log);

  })
});
// "guide" : {
//     //just a map on how to find our treasure,
//     //if u dont digg, fuck aff, .. u digg.
//     //all set are props to be stored in iamdb
//     //
//     //from starting url, enter each song page
//     "follow" : ".post > div.entry > h1 > a",
//     //set the title of the song page
//     "set" : ["title", "article.post > h1"],
//     "set" : ["", ]
//     //look for the download ;link and click it
//     "follow": "article.post > div.entry p a[target=\"_blank\"]",
//     //we prolly now on my.notjustok.
//     "set" :
// }

var def = {
  'job_name' : 'notjustok',
  'starting_url' : 'https://my.notjustok.com',
  'paginate' : '.pagination-next a',
  'limit' : 100,
  //the container for our scraper
  'scope' : '#content',
};



module.exports = {
  scraper : function (osmosis, cb) {

              return osmosis
              .config({
                'user_agent': 'Mozilla/5.0 (Linux; Android 4.4.2; Nexus 4 Build/KOT49H) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.76 Mobile Safari/537.36'
              })
              .get('https://my.notjustok.com/site/discover')
              .paginate(def.paginate, 2)
              // .find(def.scope)
              .follow('.media-heading a@href')
              .set({
                'title': '.media-heading a',
                'text' : '.track-with-user-info a',
                // 'targetSrc':'//a/@href[contains(.,".mp3")]'
              })
              .then(function (context, data, next) {
                data.url = context.doc().request.url;
                next(context, data);
              })
              // .doc()
              // .follow('.content a@href')
              .set('props', {
                'imageSrc' : '.groupPhoto@src',
                'downloadCount': '.player-count-downloads',
                'playCount': '.player-count-plays'
              })
              .follow('.download-track@href')
              .then(function (context, data, next) {
                var rx = /replace\(\"(.*)\"\);/;
                var t = context.body.text();
                var m = rx.exec(t);
                if (m && m.length > 0) {
                  data.targetSrc = m[1];
                }

                // t[0] = t[0].replace("\"", t[0]);
                // data.targetSrc = context.find('audio');
                next(context, data);
              })
              .then(function (context, data, next) {
                data.targetPageUrl =  context.doc().request.url;
                next(context, data);
              })
              .data(cb)
              .log(console.log)
              .error(console.log)
              .debug(console.log);
              // .data(_data);
  },
  def: def
};
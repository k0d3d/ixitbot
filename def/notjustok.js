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
  'starting_url' : 'http://notjustok.com/category/music/',
  'paginate' : '#wp_page_numbers > ul li > a',
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
              .get(def.proceed_from_url)
              .paginate(def.paginate)
              // .find(def.scope)
              .follow('.card-content span.title a@href')
              .set({'title': 'h2.entry-title'})
              .then(function (context, data, next) {
                data.url = context.doc().request.url;
                next(context, data);
              })
              .set({
                'text' : '.entry-content'
              })
              // .doc()
              .follow('.post .post-page-content p > strong > a@href')
//               .find('.post')
              .then(function (context, data, next) {
                data.targetSrc = '//a/@href[contains(.,".mp3")]';
                // data.targetSrc = context.find('audio');
                next(context, data);
              })
              .set({
                'subtitle': ['h2.post-title'],
                'targetSrc' : ['//a/@href[contains(.,".mp3")]']
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
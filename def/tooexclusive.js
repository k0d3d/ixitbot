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
  'job_name' : 'tooexclusive',
  'starting_url' : 'http://tooxclusive.com/main/audio/',
  'paginate' : '.pagination .prev a@href',
  'limit' : 2,
  //the container for our scraper
  'scope' : '#content',
};



module.exports = {
  scraper : function (osmosis, cb, jb) {
              return osmosis
              .config({
                'user_agent': 'Mozilla/5.0 (Linux; Android 4.4.2; Nexus 4 Build/KOT49H) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.76 Mobile Safari/537.36'
              })
              .get(jb.proceed_from_url)
              .paginate(def.paginate, def.limit)
              // .find(def.scope)
              .follow('ul li a@href')
              .set({
                'title': '#content h1',
                'targetSrc': '#content p a@href',
                // 'props' :
              })
              .set('props', {
                  targetSrcString: '#content p a',
                  mainImage: '#content p img@src'

                })
              .then(function (context, data, next) {
                data.url = context.doc().request.url;
                next(context, data);
              })
              // .set({
              //   'text' : 'h2.post-title'
              // })
              // .doc()
//               .follow('.post .post-page-content p > strong > a@href')
// //               .find('.post')
//               .then(function (context, data, next) {
//                 data.targetSrc = context.find('audio');
//                 next(context, data);
//               })
//               .set({
//                 'subtitle': ['h2.post-title'],
//                 'targetSrc' : ['audio']
//               })
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
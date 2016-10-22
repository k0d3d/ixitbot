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

var def_card = {
  'job_name' : 'tooexclusive',
  'starting_url' : 'http://tooxclusive.com/',
  'paginate' : '//*[@id="content"]/ul/li[26]/span[4]/a',
  'limit' : 1,
  //the container for our scraper
  'scope' : '#content',
};



module.exports = {
  onePage: function (osmosis, cb, jb) {
// console.lo(arguments)
              return osmosis
              .config({
                'user_agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
              })
              .get('http://tooxclusive.com/tag/audio/')
              .follow('#content li a@href')
              .set({
                'title': '#content h1',
                'targetSrc': '//a/@href[contains(.,".mp3")]', //  //a/@href[contains(., 'letter')]
                // 'props' :
              })
              .set('props', {
                  targetSrcString: '//*[@id="content"]/p[]',
                  mainImage: '//*[@id="content"]/p[1]/a/img@src'

                })
              .then(function (context, data, next) {
                data.url = context.doc().request.url;
                next(context, data);
              })
              .data(cb)
              .log(console.log)
              .error(console.log)
              .debug(console.log);
  },
  scraper : function (osmosis, cb, jb) {
              return osmosis
              .config({
                'user_agent': 'Mozilla/5.0 (Linux; Android 4.4.2; Nexus 4 Build/KOT49H) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.76 Mobile Safari/537.36'
              })
              .get(jb.proceed_from_url)
              .paginate(def_card.paginate)
              // .find(def.scope)
              .follow('ul li a@href')
              .set({
                'title': '#content h1',
                'targetSrc': '//a/@href[contains(.,".mp3")]',
                // 'props' :
              })
              .set('props', {
                  targetSrcString: '//*[@id="content"]/p[]',
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
  def: def_card
};
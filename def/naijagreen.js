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
  'job_name' : 'naijagreen',
  'starting_url' : 'http://naijagreen.com.ng/tag/jenifas-diary/',
  'paginate' : '//*[@id="content"]/ul/li[26]/span[4]/a',
  'limit' : 1000,
  //the container for our scraper
  'scope' : '#content',
  'crawler' : 'osmosis'
};



module.exports = {
  scraper: function (osmosis, cb, jb) {
// console.lo(arguments)
              return osmosis
              .config({
                'user_agent': 'Mozilla/5.0 (Linux; Android 5.1.1; Nexus 6 Build/LYZ28E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.23 Mobile Safari/537.36'
              })
              .get(jb.proceed_from_url || 'http://naijagreen.com.ng/tag/jenifas-diary/')
              .follow('a@href')
              .set({
                'title': 'title',
                // 'targetSrc': '//a/@href[contains(.,".mp3")]', //  //a/@href[contains(., 'letter')]
                targetSrc: "a[href*='.mp3'], a[href*='.mp4']"
                // 'props' :
              })
              .set('props', {
                  targetSrcString: '//*[@id="content"]/p[]',
                  mainImage: '//*[@id="content"]/p[1]/a/img@src'

                })
              .then(function (context, data, next) {
                console.log(context.doc());
                data.url = context.doc().request.url;
                next(context, data);
              })
              .data(cb)
              .log(console.log)
              .error(console.log)
              .debug(console.log);
  },
  def: def_card
};
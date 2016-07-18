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
  'job_name' : 'naijaloaded',
  'starting_url' : 'http://www.naijaloaded.com.ng/music/',
  'paginate' : '//*[@id="content"]/ul/li[31]/span[4]/a',
  'limit' : 1,
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
              .paginate(def_card.paginate)
              // .find(def.scope)
              .follow('//*[@id="content"]/ul/li[1]/a')
              // .follow('ul li a@href')
              .set({
                // 'title': '//*[@id="post-167949"]/header/h1',
                'title': '//*[@id="content"]/h1',
                'targetSrc': '//a/@href[contains(.,".mp3")]',
                // 'props' :
              })
              .set('props', {
                  targetSrcString: '//*[@id="post-167949"]/div[1]',
                  mainImage: '//*[@id="content"]/p[1]/img/@src'
                  // mainImage: 'img.alignnone@src'

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
  def: def_card
};
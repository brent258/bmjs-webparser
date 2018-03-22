const wp = require('../index.js');

module.exports = {

  search: {
    limit: 1,
    intro: 10,
    sections: 5,
    count: 15,
    category: '22',
    privacy: 'public',
    headerKeywords: wp.keywords.dogs,
    template: 'list',
    keywordType: 'PLURAL',
    keywordPlural: true,
    keywordDeterminer: '',
    keywordNoun: 'types of dogs',
    keywordList: ['dogs that don\'t shed','non shedding dogs','hypoallergenic dogs'],
    link: 'http://heartmydog.com',
    amazon: false,
    cacheOnly: true,
    multipleOnly: true,
    slideshows: 1,
    assets: '/Users/brentmccoy/Apps/node-modules/bmjs-webparser/assets/',
    images: '/Users/brentmccoy/Apps/node-modules/bmjs-webparser/cache/images/',
    voice: 'karen'
  },

  image: {
    options: null,
    tags: null,
    cacheKeyword: true,
    cacheFallback: true,
    search: 'flickr',
    limit: 2,
    fallbackLimit: 20,
    fallback: 'dogs',
    template: '',
    tagline: 'Share the love!!!',
    logo: ''
  },

  objects: [
    {
      keyword: 'non shedding dogs',
      search: {
        keywordType: '',
        keywordPlural: undefined,
        keywordDeterminer: '',
        keywordNoun: '',
        keywordList: null,
        link: ''
      },
      image: {fallback: ''}
    },
  ]
};

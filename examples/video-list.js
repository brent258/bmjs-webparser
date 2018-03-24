const wp = require('../index.js');

module.exports = {

  search: {
    limit: 1,
    intro: 20,
    sections: 10,
    count: 15,
    category: '22',
    privacy: 'public',
    headerKeywords: [],
    template: 'list',
    keywordType: 'PLURAL',
    keywordPlural: true,
    keywordDeterminer: '',
    keywordNoun: 'product',
    keywordList: ['slow feed dog bowls','slow dog feeders','brake fast dog bowls'],
    link: 'http://heartmydog.com',
    amazon: true,
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
    cacheOnly: true,
    cacheFallback: true,
    search: 'flickr',
    limit: 2,
    fallbackLimit: 20,
    fallback: 'dogs',
    template: 'imageTitle',
    tagline: 'Share the love!!!',
    logo: ''
  },

  objects: [
    {
      keyword: 'slow feed dog bowls',
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

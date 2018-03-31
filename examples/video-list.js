const wp = require('../index.js');

module.exports = {

  search: {
    limit: 1,
    intro: 20,
    sections: 10,
    count: 15,
    category: '22',
    privacy: 'public',
    template: 'list',
    keywordType: 'PLURAL',
    keywordPlural: true,
    keywordDeterminer: '',
    keywordNoun: '',
    keywordList: [],
    link: 'http://heartmydog.com',
    amazon: false,
    cacheOnly: true,
    multipleOnly: true,
    slideshows: 1,
    imageKeywords: [],
    assets: '/Users/brentmccoy/Apps/node-modules/bmjs-webparser/assets/',
    images: '/Users/brentmccoy/Apps/node-modules/bmjs-webparser/cache/images/',
    voice: 'karen',
    shuffle: true,
    random: true,
    matchRegex: null,
    strict: true,
    minLength: 0
  },

  image: {
    options: null,
    tags: null,
    cacheOnly: true,
    search: 'flickr',
    limit: 10,
    count: 2,
    fallbackLimit: 20,
    fallback: 'dogs',
    template: '',
    tagline: 'Share the love!!!',
    logo: ''
  },

  objects: [
    {
      keyword: 'slow feed dog bowls',
      search: {
        amazon: true,
        keywordType: '',
        keywordPlural: undefined,
        keywordDeterminer: '',
        keywordNoun: '',
        keywordList: ['slow dog food bowls'],
        link: '',
        imageKeywords: []
      },
      image: {fallback: '', template: 'imageTitle'}
    },
    {
      keyword: 'non shedding dogs',
      search: {
        amazon: false,
        keywordType: '',
        keywordPlural: undefined,
        keywordDeterminer: '',
        keywordNoun: '',
        keywordList: ['non shedding dogs'],
        link: '',
        imageKeywords: []
      },
      image: {fallback: '', template: 'imageOnly'}
    },
  ]
};

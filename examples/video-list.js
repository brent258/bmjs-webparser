const wp = require('../index.js');
const keywords = require('./keywords.js');

module.exports = {

  search: {
    limit: 1,
    intro: 0,
    sections: 2,
    count: 7,
    category: '22',
    privacy: 'public',
    template: 'products',
    keywordType: 'PLURAL',
    keywordPlural: true,
    keywordDeterminer: '',
    keywordNoun: '',
    keywordList: [],
    link: 'http://heartmydog.com',
    amazon: true,
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
    search: 'google',
    limit: 10,
    count: 2,
    fallback: 'dogs',
    template: 'imageAudio',
    tagline: 'Share the love!!!',
    logo: null
  },

  objects: keywords
};

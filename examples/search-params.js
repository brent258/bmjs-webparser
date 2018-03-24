const wp = require('../index.js');

module.exports = {
  limit: 1,
  intro: 20,
  sections: 15,
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
  link: '',
  amazon: false,
  cacheOnly: true,
  multipleOnly: true,
  slideshows: 1,
  assets: '/Users/brentmccoy/Apps/node-modules/bmjs-webparser/assets/',
  images: '/Users/brentmccoy/Apps/node-modules/bmjs-webparser/cache/images/',
  voice: 'karen'
};

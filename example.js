const wp = require('./index.js');
const pos = require('bmjs-engpos');

wp.init();
let searchParams = {
  count: 20,
  template: 'list',
  headerKeywords: wp.keywords.dogs,
  type: 'random',
  textKeywords: [],
  matchSections: false,
  keywordType: 'PLURAL',
  keywordPlural: true,
  keywordDeterminer: '',
  keywordNoun: 'types of dogs',
  keywordList: ['dogs that don\'t shed','non shedding dogs','hypoallergenic dogs'],
  link: 'http://heartmydog.com',
  amazon: false,
  cacheOnly: true
};
let imageParams = {
  match: true,
  cacheOnly: true,
  search: 'flickr',
  limit: 2,
  fallback: 'dogs',
  template: '',
  tagline: 'Share the love!!!'
};


wp.videosFromKeyword('non shedding dogs',searchParams,imageParams).then(data => console.log(data)).catch(err => console.log(err));
//wp.images('golden retriever',imageParams).then(data => console.log(data)).catch(err => console.log(err));

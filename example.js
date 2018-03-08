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
  amazon: true
};
let imageParams = {
  match: true,
  cacheOnly: true,
  search: 'google',
  limit: 2,
  fallback: 'dogs',
  template: ''
};
//wp.amazonPages('slow feed dog bowl',null,1).then(data => console.log(data)).catch(err => console.log(err));
wp.webpage('https://www.wikihow.com/Train-a-Dog').then(page => {
  let content = wp.pageParagraphs(page,searchParams.headerKeywords);
  console.log(content);
}).catch(err => console.log(err));

const wp = require('./index.js');
const pos = require('bmjs-engpos');

wp.init();
let searchParams = {
  count: 20,
  template: 'tips',
  headerKeywords: wp.keywords.dogs,
  type: 'random',
  textKeywords: [],
  matchSections: false,
  minResult: 1,
  maxResult: 100,
  keyword: 'dog training tips'
};
let imageParams = {
  match: true,
  cacheOnly: false,
  search: 'google',
  limit: 2,
  fallback: 'dogs',
  template: 'imageOnly'
};
//wp.pages('non shedding dogs',searchParams).then(data => console.log(data)).catch(err => console.log(err));
wp.updateTextCache({url: 'http://youtube.com/heartmydog'},'test-blacklist').then(data => console.log(data)).catch(err => console.log(err));
//wp.deleteTextCache('test-blacklist','url','http://youtube.com/heartmydog').then(data => console.log(data)).catch(err => console.log(err));

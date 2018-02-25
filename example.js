const wp = require('./index.js');
const pos = require('bmjs-engpos');

wp.init();
let searchParams = {
  count: 3,
  template: 'tips',
  headerKeywords: wp.keywords.dogs,
  type: 'random',
  textKeywords: [],
  matchSections: false
};
let imageParams = {
  match: true,
  cacheOnly: false,
  search: 'google',
  limit: 2,
  fallback: 'dogs',
  template: ''
};
//wp.webpage('https://iheartdogs.com/top-10-senior-dog-training-tips').then(msg => console.log(msg.body.content)).catch(err => console.log(err));
wp.video('dog training tips',searchParams,imageParams).then(data => console.log(data)).catch(err => console.log(err));

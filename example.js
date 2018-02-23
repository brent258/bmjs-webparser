const wp = require('./index.js');
const pos = require('bmjs-engpos');

wp.init();
let searchParams = {
  count: 3,
  template: 'tips',
  headerKeywords: wp.keywords.dogs,
  type: 'random',
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
//wp.webpage('https://www.wikihow.com/Train-a-Dog').then(msg => console.log(wp.randomParagraph(msg,2,null,['dog training']))).catch(err => console.log(err));
wp.video('dog training tips',searchParams,imageParams).then(data => console.log(data)).catch(err => console.log(err));

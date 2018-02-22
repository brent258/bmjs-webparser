const wp = require('./index.js');
const pos = require('bmjs-engpos');

wp.init();
let searchParams = {
  count: 3,
  template: 'list',
  textKeywords: ['shedding'],
  headerKeywords: wp.keywords.dogs,
  type: 'random',
};
let imageParams = {
  match: true,
  cacheOnly: false,
  search: 'google',
  limit: 2,
  fallback: 'dogs',
  template: ''
};
//wp.webpage('http://www.akc.org/content/entertainment/articles/9-facts-about-pekingese/').then(msg => console.log(wp.firstParagraph(msg,'pekingese'))).catch(err => console.log(err));
wp.video('non shedding dogs',searchParams,imageParams).then(data => console.log(data)).catch(err => console.log(err));

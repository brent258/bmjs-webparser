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
wp.webpage('https://www.wikihow.com/Train-a-Dog').then(msg => console.log(msg.body.content)).catch(err => console.log(err));
//wp.video('non shedding dogs',searchParams,imageParams).then(data => console.log(data)).catch(err => console.log(err));

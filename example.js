const wp = require('./index.js');
const pos = require('bmjs-engpos');

wp.init();
let search = {
  url: 'http://dogtime.com/dog-breeds/pomeranian',
  count: 2
};
let image = {
  match: true,
  cacheOnly: false,
  search: 'google',
  limit: 10,
  fallback: 'pomeranian'
};
//wp.webpage(search.url).then(msg => console.log(wp.randomParagraph(msg))).catch(err => console.log(err));
wp.videoSlides(search,image).then(msg => console.log(msg)).catch(err => console.log(err));

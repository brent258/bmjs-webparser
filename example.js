const wp = require('./index.js');
const pos = require('bmjs-engpos');

wp.init();
let search = {
  count: 2
};
let image = {
  match: true,
  cacheOnly: false,
  search: 'google',
  limit: 2,
  fallback: 'pomeranian'
};
//wp.webpage(search.url).then(msg => console.log(wp.randomParagraph(msg))).catch(err => console.log(err));
wp.video('pomeranian facts',search,image).then(msg => console.log(msg)).catch(err => console.log(err));

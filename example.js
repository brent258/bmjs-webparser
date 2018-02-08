const wp = require('./index.js');
const pos = require('bmjs-engpos');

wp.init();
let search = {
  url: 'https://www.homesalive.ca/blog/dogs-that-dont-shed-23-hypoallergenic-dog-breeds/',
  count: 2
};
let image = {
  fallback: 'dogs',
  match: true,
  cacheOnly: true,
  search: 'google',
  limit: 1
};
//wp.webpage(search.url).then(msg => console.log(wp.randomParagraph(msg))).catch(err => console.log(err));
wp.video('pomeranian',search,image).then(msg => console.log(msg)).catch(err => console.log(err));

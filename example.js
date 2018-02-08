const wp = require('./index.js');
const pos = require('bmjs-engpos');

wp.init();
let search = {
  url: 'https://www.homesalive.ca/blog/dogs-that-dont-shed-23-hypoallergenic-dog-breeds/',
  count: 2
};
let image = {
  fallback: 'dogs'
};
//wp.webpage(search.url).then(msg => console.log(wp.randomParagraph(msg))).catch(err => console.log(err));
wp.videoSlides(search,image).then(msg => console.log(msg)).catch(err => console.log(err));

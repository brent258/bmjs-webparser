const wp = require('./index.js');
const pos = require('bmjs-engpos');

wp.init();
let search = {
  count: 7,
  template: 'tips'
};
let image = {
  match: true,
  cacheOnly: false,
  search: 'google',
  limit: 2,
  fallback: 'dogs'
};
wp.webpage('https://www.homesalive.ca/blog/dogs-that-dont-shed-23-hypoallergenic-dog-breeds/').then(msg => console.log(wp.randomParagraph(msg,2,wp.keywords.dogs,['hypoallergenic dog breed']))).catch(err => console.log(err));
//wp.video('tick prevention for dogs',search,image).then(msg => console.log(msg)).catch(err => console.log(err));
//console.log(wp.parseText('\tFirst, ask your dog to “Sit.”'));

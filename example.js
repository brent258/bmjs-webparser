const wp = require('./index.js');
const pos = require('bmjs-engpos');

wp.init();
let search = {
  count: 7,
  template: 'facts',
  textKeywords: ['breed'],
};
let image = {
  match: true,
  cacheOnly: false,
  search: 'google',
  limit: 2,
  fallback: 'pekingese',
};
//wp.webpage('https://www.homesalive.ca/blog/dogs-that-dont-shed-23-hypoallergenic-dog-breeds/').then(msg => console.log(wp.randomParagraph(msg,2))).catch(err => console.log(err));
wp.video('pekingese facts',search,image).then(msg => console.log(msg)).catch(err => console.log(err));

//console.log(wp.parseText('\tFirst, ask your dog to “Sit.”'));

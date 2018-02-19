const wp = require('./index.js');
const pos = require('bmjs-engpos');

wp.init();
let search = {
  count: 7,
  template: 'facts',
  textKeywords: ['pekingese'],
};
let image = {
  match: true,
  cacheOnly: false,
  search: 'google',
  limit: 2,
  fallback: 'pekingese',
};
wp.webpage('https://en.wikipedia.org/wiki/Pekingese').then(msg => console.log(wp.firstParagraph(msg,2,null,['coat']))).catch(err => console.log(err));

//console.log(wp.parseText('\tFirst, ask your dog to “Sit.”'));

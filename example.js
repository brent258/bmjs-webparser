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
//wp.webpage('http://www.akc.org/content/entertainment/articles/9-facts-about-pekingese/').then(msg => console.log(wp.firstParagraph(msg,'pekingese'))).catch(err => console.log(err));
wp.webpage('http://www.akc.org/content/entertainment/articles/9-facts-about-pekingese/').then(msg => console.log(wp.randomParagraph(msg,2,null,['pekingese']))).catch(err => console.log(err));

//console.log(wp.parseText('\tFirst, ask your dog to “Sit.”'));

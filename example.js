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
wp.webpage('http://www.akc.org/content/dog-care/articles/small-dogs-that-dont-shed/').then(msg => console.log(msg.body.content)).catch(err => console.log(err));
//wp.video('tick prevention for dogs',search,image).then(msg => console.log(msg)).catch(err => console.log(err));

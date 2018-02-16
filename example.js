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
//wp.webpage('https://www.wikihow.com/Train-a-Dog').then(msg => console.log(msg.body.content)).catch(err => console.log(err));
//wp.video('tick prevention for dogs',search,image).then(msg => console.log(msg)).catch(err => console.log(err));
//console.log(wp.parseText('\tFirst, ask your dog to “Sit.”'));
console.log(wp.keywords.dogs);

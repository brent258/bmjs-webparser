const wp = require('./index.js');
const pos = require('bmjs-engpos');

wp.init();
let searchParams = {
  count: 20,
  template: 'list',
  headerKeywords: wp.keywords.dogs,
  type: 'random',
  textKeywords: [],
  matchSections: false,
  keywordType: 'PLURAL',
  keywordPlural: true,
  keywordDeterminer: '',
  keywordNoun: 'types of dogs',
  keywordList: ['dogs that don\'t shed','non shedding dogs','hypoallergenic dogs'],
  link: 'http://heartmydog.com',
  amazon: true
};
let imageParams = {
  match: true,
  cacheOnly: true,
  search: 'google',
  limit: 2,
  fallback: 'dogs',
  template: ''
};
wp.amazonPages('batman',null,1).then(data => console.log(data)).catch(err => console.log(err));
/*wp.amazonProduct({ url: 'https://www.amazon.com/Superhero-Costume-Dress-Up-Kids/dp/B076VQSFBT/ref=sr_1_9/134-9751470-1839260?ie=UTF8&qid=1520296356&sr=8-9&keywords=batman',
    text: 'Funhall Superhero Costume and Dress Up for Kids - Satin Cape and Felt Mask',
    keyword: 'batman' }).then(data => console.log(data)).catch(err => console.log(err));*/

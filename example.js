const wp = require('./index.js');
const pos = require('bmjs-engpos');

wp.init();
let searchParams = {
  limit: 2,
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
  amazon: false,
  cacheOnly: true
};
let imageParams = {
  match: true,
  cacheOnly: true,
  search: 'flickr',
  limit: 2,
  fallback: 'dogs',
  template: '',
  tagline: 'Share the love!!!'
};


wp.pages('non shedding dogs',searchParams).then(data => console.log(data)).catch(err => console.log(err));
//wp.deleteImages([{keyword: 'yorkshire terrier', value: 'Yorkie_or_Yorkshire_Terrier_%2811406003593%29.png'}],'filename').then(data => console.log(data)).catch(err => console.log(err));
//wp.updateTextCacheMultiple([{name: 'Brent'}],'test-keyword').then(data => console.log(data)).catch(err => console.log(err));

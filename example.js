const wp = require('./index.js');
const pos = require('bmjs-engpos');

wp.init();
let searchParams = {
  limit: 1,
  template: 'list',
  category: '22',
  privacy: 'public',
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
  cacheOnly: true,
  multipleOnly: true,
  slideshows: 1
};
let imageParams = {
  match: true,
  cacheFallback: true,
  search: 'flickr',
  limit: 2,
  fallback: 'dogs',
  template: 'imageOnly',
  tagline: 'Share the love!!!'
};


wp.videosFromFile('./examples/video-list.js').then(data => console.log(data)).catch(err => console.log(err));
//wp.deleteImages([{keyword: 'yorkshire terrier', value: 'Yorkie_or_Yorkshire_Terrier_%2811406003593%29.png'}],'filename').then(data => console.log(data)).catch(err => console.log(err));
//wp.updateTextCacheMultiple([{name: 'Brent'}],'test-keyword').then(data => console.log(data)).catch(err => console.log(err));

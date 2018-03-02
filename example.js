const wp = require('./index.js');
const pos = require('bmjs-engpos');

wp.init();
let searchParams = {
  count: 20,
  template: 'tips',
  headerKeywords: wp.keywords.dogs,
  type: 'random',
  textKeywords: [],
  matchSections: false,
  minResult: 1,
  maxResult: 100,
  keyword: 'dog training tips'
};
let imageParams = {
  match: true,
  cacheOnly: false,
  search: 'google',
  limit: 2,
  fallback: 'dogs',
  template: 'imageOnly'
};
wp.webpage('https://designerdoginfo.wordpress.com/tag/dog-training-tips/').then(msg => {
  let fallbackImageParams = wp.setImageParams(imageParams);
  fallbackImageParams.limit = 20;
  wp.images(imageParams.fallback,fallbackImageParams).then(fallbackImages => {
    wp.videoPropertiesMultiple(msg.body.content,searchParams,imageParams,fallbackImages).then(data => console.log(data)).catch(err => console.log(err));
  }).catch(err => console.log(err));
}).catch(err => console.log(err));

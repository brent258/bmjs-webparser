const wp = require('./index.js');
const pos = require('bmjs-engpos');

wp.init();
let searchParams = {
  count: 1,
  template: 'facts',
  textKeywords: ['pekingese'],
  headerKeywords: wp.keywords.dogs,
  type: 'intro',
  url: 'https://www.hillspet.com/dog-care/dog-breeds/pekingese',
  keyword: 'pekingese facts'
};
let imageParams = {
  match: true,
  cacheOnly: false,
  search: 'google',
  limit: 2,
  fallback: 'pekingese',
  template: ''
};
//wp.webpage('http://www.akc.org/content/entertainment/articles/9-facts-about-pekingese/').then(msg => console.log(wp.firstParagraph(msg,'pekingese'))).catch(err => console.log(err));
let fallbackImageParams = imageParams;
let keywordStore = [];
let pageStore = [];
fallbackImageParams.limit = 20;
if (wp.debug) console.log('Retrieving images for fallback keyword: ' + imageParams.fallback);
wp.images(imageParams.fallback,fallbackImageParams).then(fallbackImages => {
  if (!fallbackImages.length) console.log('No images found for fallback keyword: ' + imageParams.fallback);
  if (this.debug) console.log('Finished retrieving images for fallback keyword: ' + imageParams.fallback);
  wp.videoSlides(searchParams,imageParams,fallbackImages,keywordStore,pageStore).then(data => {
    console.log(keywordStore);
    console.log(pageStore);
    console.log(data);
  }).catch(err => console.log(err));
}).catch(err => console.log(err));
//console.log(wp.parseText('\tFirst, ask your dog to “Sit.”'));

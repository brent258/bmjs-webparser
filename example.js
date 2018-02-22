const wp = require('./index.js');
const pos = require('bmjs-engpos');

wp.init();
let searchParams = {
  count: 1,
  template: 'facts',
  textKeywords: ['maltese'],
  headerKeywords: wp.keywords.dogs,
  type: 'random',
  url: 'https://www.homesalive.ca/blog/dogs-that-dont-shed-23-hypoallergenic-dog-breeds/',
  keyword: 'non shedding dogs'
};
let imageParams = {
  match: true,
  cacheOnly: false,
  search: 'google',
  limit: 2,
  fallback: 'dogs',
  template: ''
};
//wp.webpage('http://www.akc.org/content/entertainment/articles/9-facts-about-pekingese/').then(msg => console.log(wp.firstParagraph(msg,'pekingese'))).catch(err => console.log(err));
let keywordStore = [];
let pageStore = [];
let fallbackImageParams = Object.assign({},imageParams);
/*fallbackImageParams.limit = 20;
if (wp.debug) console.log('Retrieving images for fallback keyword: ' + imageParams.fallback);
wp.images(imageParams.fallback,fallbackImageParams).then(fallbackImages => {
  if (!fallbackImages.length) console.log('No images found for fallback keyword: ' + imageParams.fallback);
  if (this.debug) console.log('Finished retrieving images for fallback keyword: ' + imageParams.fallback);
  wp.videoSlides(searchParams,imageParams,fallbackImages,keywordStore,pageStore).then(data => {
    console.log(keywordStore);
    console.log(pageStore);
    console.log(data);
  }).catch(err => console.log(err));
}).catch(err => console.log(err));*/
//console.log(wp.parseText('\tFirst, ask your dog to “Sit.”'));
wp.flickrImageLoop('dogs',imageParams).then(data => {
  wp.updateImageCacheMultiple(data,'dogs',imageParams.crop).then(msg => {
    console.log(msg);
    wp.readImageCache('dogs').then(msg => {
      console.log(JSON.parse(msg));
    }).catch(err => console.log(err));
  }).catch(err => console.log(err));
}).catch(err => console.log(err));

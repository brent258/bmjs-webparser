const wp = require('./index.js');
const pos = require('bmjs-engpos');

wp.init();
wp.flickrImage('japanese spitz').then(data => {
  wp.updateImageCache(data[0],'japanese spitz').then(msg => console.log(msg)).catch(err => console.log(err));
}).catch(err => console.log(err));
console.log(wp.cachePath);

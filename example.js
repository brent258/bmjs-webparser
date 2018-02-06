const wp = require('./index.js');
const pos = require('bmjs-engpos');

wp.init();
wp.addProxy([]);
wp.flickrImage('japanese spitz').then(data => {
  wp.downloadImage(data[0],'cache/' + data[0].filename,true,400,400).then(msg => console.log(msg)).catch(err => console.log(err));
}).catch(err => console.log(err));

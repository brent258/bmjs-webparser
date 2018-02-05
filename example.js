const wp = require('./index.js');
const pos = require('bmjs-engpos');

pos.init();

wp.flickrImage('japanese spitz',{},3).then(data => console.log(data)).catch(err => console.log(err));

const wp = require('./index.js');
const pos = require('bmjs-engpos');

wp.init();
wp.images('labrador',{limit: 1, cacheOnly: false}).then(msg => console.log(msg)).catch(err => console.log(err));

const wp = require('./index.js');
const pos = require('bmjs-engpos');

wp.init();
wp.images('cocker spaniel',{limit: 3, cacheOnly: false, exact: false}).then(msg => console.log(msg)).catch(err => console.log(err));

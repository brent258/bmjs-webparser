const wp = require('./index.js');
const pos = require('bmjs-engpos');

pos.init();

wp.search('non shedding dogs',11,30).then(data => console.log(data)).catch(err => console.log(err));
wp.search('non shedding dogs',11,30).then(data => console.log(data)).catch(err => console.log(err));

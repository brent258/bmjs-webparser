const wp = require('./index.js');
const pos = require('bmjs-engpos');

wp.init();

wp.updateTextCacheMultiple([{type: 'strawberry'},{type: 'chocolate'},{type: 'jam'}],'donuts').then(data => console.log(data)).catch(err => console.log(err));

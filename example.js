const wp = require('./index.js');
const pos = require('bmjs-engpos');

wp.init();
wp.webpage('https://www.wikihow.com/Train-a-Dog').then(msg => console.log(msg.body.content)).catch(err => console.log(err));

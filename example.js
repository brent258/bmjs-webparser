const wp = require('./index.js');
const pos = require('bmjs-engpos');

wp.init();
wp.webpage('https://www.homesalive.ca/blog/dogs-that-dont-shed-23-hypoallergenic-dog-breeds/').then(msg => console.log(msg.body.content)).catch(err => console.log(err));

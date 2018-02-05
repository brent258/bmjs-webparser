const wp = require('./index.js');
const pos = require('bmjs-engpos');

pos.init();

wp.webpage('https://www.homesalive.ca/blog/dogs-that-dont-shed-23-hypoallergenic-dog-breeds/').then(data => console.log(data.body.content));

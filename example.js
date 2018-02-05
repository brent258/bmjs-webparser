const wp = require('./index.js');
const pos = require('bmjs-engpos');

pos.init();

wp.googleImage('japanese spitz').then(data => console.log(data)).catch(err => console.log(err));

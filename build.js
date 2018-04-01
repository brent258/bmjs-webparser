const cheerio = require('cheerio');
const fs = require('fs');
const request = require('request-promise');

let build = function() {
  let options = {
    method: 'GET',
    uri: 'https://en.wikipedia.org/wiki/List_of_dog_breeds',
    gzip: true,
    timeout: 2000,
    headers: {'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:20.0) Gecko/20100101 Firefox/20.0'}
  };
  request(options).then(html => {
    let $ = cheerio.load(html);
    let list = [];
    $('.wikitable.sortable tr').each(function(i,el) {
      let line = $(this).children().first().text();
      list.push(`\n\t'${line.toLowerCase()}'`);
    });
    let text = `module.exports = [${list.join('')}\n];`;
    fs.writeFile('lib/dogs.js',text,err => {
      if (err) console.log(err);
      console.log('Done.');
    });
  }).catch(err => console.log(err));
};

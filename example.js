const wp = require('./index.js');
const addImageList = require('./examples/add-image-list.js');
const deleteImageList = require('./examples/delete-image-list.js');
const searchParams = require('./examples/search-params.js');
const imageParams = require('./examples/image-params.js');
const apiParams = require('./examples/api-params.js');
const fs = require('fs');

wp.init();
// Create videos
//wp.videosFromFile('./examples/video-list.js',true).then(data => console.log(data)).catch(err => console.log(err));
//wp.videosFromKeyword('non shedding dogs',searchParams,imageParams).then(data => console.log(data)).catch(err => console.log(err));
// Add images
//wp.addImages(wp.keywords.dogs,imageParams,false).then(data => console.log(data)).catch(err => console.log(err));
// Delete images
//wp.deleteImages(deleteImageList,'filename').then(data => console.log(data)).catch(err => console.log(err));
// Upload videosFromFile
//wp.upload('assets/upload-metadata.json',apiParams);
// Search for pages
//wp.pagesFromFile('./examples/video-list.js').then(data => console.log(data)).catch(err => console.log(err));
//wp.webpage('https://www.wikihow.com/Train-a-Dog').then(data => fs.writeFileSync('test-webpage.txt',data.body,'utf8')).catch(err => console.log(err));
//wp.parseParagraphs('test-webpage.txt',searchParams).then(data => console.log(data)).catch(err => console.log(err));
// Create keywords
wp.videoKeywordsFromFile('examples/keywords.txt','examples/keywords.js');

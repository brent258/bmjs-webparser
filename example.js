const wp = require('./index.js');
const addImageList = require('./examples/add-image-list.js');
const deleteImageList = require('./examples/delete-image-list.js');
const searchParams = require('./examples/search-params.js');
const imageParams = require('./examples/image-params.js');
const apiParams = require('./examples/api-params.js');

wp.init();
// Create videos
wp.videosFromFile('./examples/video-list.js').then(data => console.log(data)).catch(err => console.log(err));
//wp.videosFromKeyword('non shedding dogs',searchParams,imageParams).then(data => console.log(data)).catch(err => console.log(err));
// Add images
//wp.addImages(addImageList,imageParams,true).then(data => console.log(data)).catch(err => console.log(err));
// Delete images
//wp.deleteImages(deleteImageList,'filename').then(data => console.log(data)).catch(err => console.log(err));
// Upload videosFromFile
//wp.upload('assets/upload-metadata.json',apiParams);

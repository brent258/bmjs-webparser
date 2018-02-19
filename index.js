const request = require('request-promise');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const jimp = require('jimp');
const rand = require('bmjs-random');
const pos = require('bmjs-engpos');
const shuffle = require('bmjs-shuffle');

module.exports = {

  assetsPath: '',
  cachePath: '',
  paused: false,
  proxies: [],
  lastGoogleProxy: '',
  lastBingProxy: '',
  lastFlickrProxy: '',
  lastWebSearch: '',
  imageBlacklist: [],
  textBlacklist: [],
  imageQueue: {list: [], data: []},
  textQueue: {list: [], data: []},
  keywords: require('./lib/keywords.js'),
  timeout: 5000,
  debug: true,

  pause: function() {
    this.paused = true;
  },

  unpause: function() {
    this.paused = false;
  },

  setTimeout: function(timeout) {
    if (typeof timeout === 'number') this.timeout = timeout;
  },

  setDebug: function(debug) {
    if (!debug) this.debug = false;
  },

  init: function() {
    pos.init();
    if (!this.assetsPath) {
      this.setAssetsPath();
      this.createAssets();
    }
    if (!this.cachePath) {
      this.setCachePath();
      this.createCache();
    }
    this.paused = false;
    this.proxies = [];
    this.lastGoogleProxy = '';
    this.lastBingProxy = '';
    this.lastFlickrProxy = '';
    this.lastWebSearch = '';
    this.imageBlacklist = [];
    this.textBlacklist = [];
    this.imageQueue = {list: [], data: []};
    this.textQueue = {list: [], data: []};
    this.timeout = 5000;
    this.debug = true;
  },

  addImageBlacklist: function(item) {
    if (typeof item === 'object' && item[0] && typeof item[0] === 'object') {
      this.imageBlacklist = this.imageBlacklist.concat(item);
    }
    else if (typeof item === 'object') {
      this.imageBlacklist.push(item);
    }
  },

  addTextBlacklist: function(item) {
    if (typeof item === 'object' && item[0] && typeof item[0] === 'object') {
      this.textBlacklist = this.textBlacklist.concat(item);
    }
    else if (typeof item === 'object') {
      this.textBlacklist.push(item);
    }
  },

  checkImageBlacklist: function(item) {
    if (typeof item !== 'string') return;
    for (let i = 0; i < this.imageBlacklist.length; i++) {
      if (item.match(this.imageBlacklist[i])) return true;
    }
    return false;
  },

  checkTextBlacklist: function(item) {
    if (typeof item !== 'string') return;
    for (let i = 0; i < this.textBlacklist.length; i++) {
      if (item.match(this.textBlacklist[i])) return true;
    }
    return false;
  },

  addProxy: function(proxy) {
    if (typeof proxy === 'object' && proxy[0] && typeof proxy[0] === 'string') {
      this.proxies = this.proxies.concat(proxy);
    }
    else if (typeof proxy === 'string') {
      this.proxies.push(proxy);
    }
  },

  googleProxy: function() {
    if (!this.lastGoogleProxy) {
      this.lastGoogleProxy = this.proxies[0] || undefined;
    }
    else if (this.proxies.length && this.proxies.indexOf(this.lastGoogleProxy) < this.proxies.length-1) {
      this.lastGoogleProxy = this.proxies[this.proxies.indexOf(this.lastGoogleProxy)+1];
    }
    else {
      this.lastGoogleProxy = this.proxies[0] || undefined;
    }
    return this.lastGoogleProxy;
  },

  bingProxy: function() {
    if (!this.lastBingProxy) {
      this.lastBingProxy = this.proxies[0] || undefined;
    }
    else if (this.proxies.length && this.proxies.indexOf(this.lastBingProxy) < this.proxies.length-1) {
      this.lastBingProxy = this.proxies[this.proxies.indexOf(this.lastBingProxy)+1];
    }
    else {
      this.lastBingProxy = this.proxies[0] || undefined;
    }
    return this.lastBingProxy;
  },

  flickrProxy: function() {
    if (!this.lastFlickrProxy) {
      this.lastFlickrProxy = this.proxies[0] || undefined;
    }
    else if (this.proxies.length && this.proxies.indexOf(this.lastFlickrProxy) < this.proxies.length-1) {
      this.lastFlickrProxy = this.proxies[this.proxies.indexOf(this.lastFlickrProxy)+1];
    }
    else {
      this.lastFlickrProxy = this.proxies[0] || undefined;
    }
    return this.lastFlickrProxy;
  },

  addTextQueue: function(data,keyword) {
    this.textQueue.data.push({data: data, keyword: keyword});
    this.textQueue.list.push(keyword);
  },

  addImageQueue: function(data,keyword) {
    this.imageQueue.data.push({data: data, keyword: keyword});
    this.imageQueue.list.push(keyword);
  },

  updateTextQueue: function(keyword) {
    return new Promise((resolve,reject) => {
      if (!keyword) {
        reject('Unable to update text queue without keyword.');
      }
      else {
        if (this.textQueue.list.includes(keyword) && this.textQueue.data.length) {
          fs.writeFile(this.cachePath + '/data/text/' + this.textQueue.data[0].keyword + '.json', JSON.stringify(this.textQueue.data[0].data), err => {
            this.textQueue.list.shift();
            this.textQueue.data.shift();
            this.updateTextQueue(keyword).then(() => resolve()).catch(err => reject(err));
          });
        }
        else {
          resolve();
        }
      }
    });
  },

  updateImageQueue: function(keyword) {
    return new Promise((resolve,reject) => {
      if (!keyword) {
        reject('Unable to update image queue without keyword.');
      }
      else {
        if (this.imageQueue.list.includes(keyword) && this.imageQueue.data.length) {
          fs.writeFile(this.cachePath + '/data/images/' + this.imageQueue.data[0].keyword + '.json', JSON.stringify(this.imageQueue.data[0].data), err => {
            this.imageQueue.list.shift();
            this.imageQueue.data.shift();
            this.updateImageQueue(keyword).then(() => resolve()).catch(err => reject(err));
          });
        }
        else {
          resolve();
        }
      }
    });
  },

  createTextCache: function(keyword) {
    return new Promise((resolve,reject) => {
      if (!keyword) {
        reject('Unable to create text cache without keyword.');
      }
      else {
        if (fs.existsSync(this.cachePath + '/data/text/' + keyword + '.json')) {
          resolve('Text cache already exists for: ' + keyword);
        }
        else {
          let data = [];
          fs.writeFile(this.cachePath + '/data/text/' + keyword + '.json', JSON.stringify(data), err => {
            if (err) reject(err);
            resolve('Text cache created for: ' + keyword);
          });
        }
      }
    });
  },

  readTextCache: function(keyword) {
    return new Promise((resolve,reject) => {
      if (!keyword) {
        reject('Unable to read text cache without keyword.');
      }
      else {
        if (!fs.existsSync(this.cachePath + '/data/text/' + keyword + '.json')) {
          reject('Text cache not found for: ' + keyword);
        }
        else {
          fs.readFile(this.cachePath + '/data/text/' + keyword + '.json', (err,data) => {
            if (err) reject(err);
            resolve(data);
          });
        }
      }
    });
  },

  updateTextCache: function(obj,keyword) {
    return new Promise((resolve,reject) => {
      if (!keyword || !obj) {
        reject('Unable to update text cache without keyword and object.');
      }
      else {
        this.createTextCache(keyword).then(() => {
          this.readTextCache(keyword).then(data => {
            data = JSON.parse(data);
            if (!data.length || !this.objectInArray(obj,data)) {
              data.push(obj);
              this.addTextQueue(data,keyword);
              this.updateTextQueue(keyword).then(() => {
                resolve('Finished updating text cache for: ' + keyword);
              }).catch(err => reject(err));
            }
            else {
              resolve('Item already found in text cache for: ' + keyword);
            }
          }).catch(err => reject(err));
        }).catch(err => reject(err));
      }
    });
  },

  updateTextCacheMultiple: function(obj,keyword,index) {
    return new Promise((resolve,reject) => {
      if (!keyword || !obj) {
        reject('Unable to update text cache without keyword and object array.');
      }
      else {
        if (!index) index = 0;
        if (obj[0]) {
          this.updateTextCache(obj[0],keyword).then(data => {
            if (this.debug) console.log(data);
            obj.shift();
            index++;
            this.updateTextCacheMultiple(obj,keyword,index).then(data => resolve(data)).catch(err => reject(err));
          }).catch(err => reject(err));
        }
        else {
          resolve(`Finished adding ${index} item(s) to text cache for keyword: ${keyword}`);
        }
      }
    });
  },

  createImageCache: function(keyword) {
    return new Promise((resolve,reject) => {
      if (!keyword) {
        reject('Unable to create image cache without keyword.');
      }
      else {
        if (fs.existsSync(this.cachePath + '/data/images/' + keyword + '.json') && fs.existsSync(this.cachePath + '/images/' + keyword)) {
          resolve('Image cache already exists for: ' + keyword);
        }
        else {
          let data = [];
          fs.writeFile(this.cachePath + '/data/images/' + keyword + '.json', JSON.stringify(data), err => {
            if (err) reject(err);
            fs.mkdir(this.cachePath + '/images/' + keyword, err => {
              if (err) reject(err);
              resolve('Image cache created for: ' + keyword);
            });
          });
        }
      }
    });
  },

  readImageCache: function(keyword) {
    return new Promise((resolve,reject) => {
      if (!keyword) {
        reject('Unable to read image cache without keyword.');
      }
      else {
        if (!fs.existsSync(this.cachePath + '/data/images/' + keyword + '.json')) {
          reject('Image cache not found for: ' + keyword);
        }
        else {
          fs.readFile(this.cachePath + '/data/images/' + keyword + '.json', (err,data) => {
            if (err) reject(err);
            resolve(data);
          });
        }
      }
    });
  },

  updateImageCache: function(obj,keyword,scaleToFill) {
    return new Promise((resolve,reject) => {
      if (!keyword || !obj) {
        reject('Unable to update image cache without keyword and object.');
      }
      else {
        if (scaleToFill === undefined) scaleToFill = true;
        this.createImageCache(keyword).then(() => {
          this.readImageCache(keyword).then(data => {
            data = JSON.parse(data);
            if (!data.length || !this.objectInArray(obj,data,['tags','search','copyright'])) {
              data.push(obj);
              this.downloadImage(obj,this.cachePath + '/images/' + keyword + '/' + obj.filename,scaleToFill).then(msg => {
                if (this.debug) console.log(msg);
                this.addImageQueue(data,keyword);
                this.updateImageQueue(keyword).then(() => {
                  resolve('Finished updating image cache for: ' + keyword);
                }).catch(err => reject(err));
              }).catch(err => reject(err));
            }
            else {
              resolve('Item already found in image cache for: ' + keyword);
            }
          }).catch(err => reject(err));
        }).catch(err => reject(err));
      }
    });
  },

  updateImageCacheMultiple: function(obj,keyword,scaleToFill,limit,index) {
    return new Promise((resolve,reject) => {
      if (!keyword || !obj) {
        reject('Unable to update image cache without keyword and object array.');
      }
      else {
        if (scaleToFill === undefined) scaleToFill = true;
        if (!limit) limit = 0;
        if (!index) index = 0;
        if (obj[0] && index < limit) {
          this.updateImageCache(obj[0],keyword,scaleToFill).then(data => {
            if (this.debug) console.log(data);
            obj.shift();
            index++;
            this.updateImageCacheMultiple(obj,keyword,scaleToFill,limit,index).then(data => resolve(data)).catch(err => reject(err));
          }).catch(err => reject(err));
        }
        else {
          resolve(`Finished adding ${index} item(s) to image cache for keyword: ${keyword}`);
        }
      }
    });
  },

  setAssetsPath: function(dir) {
    if (!dir || typeof dir !== 'string') {
      this.assetsPath = __dirname + '/assets';
    }
    else {
      this.assetsPath = dir;
    }
  },

  createAssets: function() {
    if (!this.assetsPath) this.setAssetsPath();
    if (!fs.existsSync(this.assetsPath)) {
      if (this.debug) console.log('Assets directory not found. Creating folder...');
      fs.mkdir(this.assetsPath,err => {
        if (err && this.debug) console.log(err);
        if (this.debug) console.log('Finished creating assets directory.');
      });
    }
    else {
      if (this.debug) console.log('Assets directory already exists.');
    }
  },

  setCachePath: function(dir) {
    if (!dir || typeof dir !== 'string') {
      this.cachePath = __dirname + '/cache';
    }
    else {
      this.cachePath = dir;
    }
  },

  createCache: function() {
    if (!this.cachePath) this.setCachePath();
    if (!fs.existsSync(this.cachePath)) {
      if (this.debug) console.log('Cache directory not found. Creating folder...');
      fs.mkdir(this.cachePath,err => {
        if (err && this.debug) console.log(err);
        if (this.debug) console.log('Finished creating cache directory.');
      });
    }
    else {
      if (this.debug) console.log('Cache directory already exists.');
    }
    if (!fs.existsSync(this.cachePath + '/data')) {
      if (this.debug) console.log('Data cache directory not found. Creating folder...');
      fs.mkdir(this.cachePath + '/data',err => {
        if (err && this.debug) console.log(err);
        if (this.debug) console.log('Finished creating data cache directory.');
      });
    }
    else {
      if (this.debug) console.log('Data cache directory already exists.');
    }
    if (!fs.existsSync(this.cachePath + '/images')) {
      if (this.debug) console.log('Image cache directory not found. Creating folder...');
      fs.mkdir(this.cachePath + '/images',err => {
        if (err && this.debug) console.log(err);
        if (this.debug) console.log('Finished creating image cache directory.');
      });
    }
    else {
      if (this.debug) console.log('Image cache directory already exists.');
    }
    if (!fs.existsSync(this.cachePath + '/data/text')) {
      if (this.debug) console.log('Text data cache directory not found. Creating folder...');
      fs.mkdir(this.cachePath + '/data/text',err => {
        if (err && this.debug) console.log(err);
        if (this.debug) console.log('Finished creating text data cache directory.');
      });
    }
    else {
      if (this.debug) console.log('Text data cache directory already exists.');
    }
    if (!fs.existsSync(this.cachePath + '/data/images')) {
      if (this.debug) console.log('Image data cache directory not found. Creating folder...');
      fs.mkdir(this.cachePath + '/data/images',err => {
        if (err && this.debug) console.log(err);
        if (this.debug) console.log('Finished creating image data cache directory.');
      });
    }
    else {
      if (this.debug) console.log('Image data cache directory already exists.');
    }
  },

  objectInArray: function(obj,arr,ignoreKeys) {
    if (!obj || !arr || typeof obj !== 'object' || typeof arr !== 'object' || !arr[0]) {
      return false;
    }
    if (!ignoreKeys) ignoreKeys = [];
    let keys = Object.keys(obj);
    if (!keys.length) return false;
    for (let i = 0; i < arr.length; i++) {
      let matches = true;
      for (let j = 0; j < keys.length; j++) {
        if (!ignoreKeys.includes(keys[j]) && (!arr[i][keys[j]] || arr[i][keys[j]] !== obj[keys[j]])) {
          matches = false;
          break;
        }
      }
      if (matches) return true;
    }
    return false;
  },

  calculateImageCrop: function(width,height) {
    if ((width * 2) < height) {
      return {h: 'HORIZONTAL_ALIGN_CENTER', v: 'VERTICAL_ALIGN_TOP'};
    }
    else if ((height * 2) < width) {
      return {h: 'HORIZONTAL_ALIGN_CENTER', v: 'VERTICAL_ALIGN_BOTTOM'};
    }
    else {
      return {h: 'HORIZONTAL_ALIGN_CENTER', v: 'VERTICAL_ALIGN_CENTER'};
    }
  },

  downloadImage: function(obj,savePath,scaleToFill,width,height) {
    return new Promise((resolve,reject) => {
      setTimeout(() => {
        resolve('Server request timeout downloading image: ' + obj.image);
      },this.timeout*2);
      if (!obj || !savePath) {
        reject('Unable to download image without image object and save path.');
      }
      else {
        if (scaleToFill === undefined) scaleToFill = true;
        if (!width) width = 1280;
        if (!height) height = 720;
        jimp.read(obj.image).then(image => {
          if (!image) {
            reject('No image found at: ' + obj.image);
          }
          else if (scaleToFill) {
            let crop = this.calculateImageCrop(obj.width,obj.height);
            image.cover(width,height,jimp[crop.h]|jimp[crop.v]).write(savePath);
            resolve('Image saved to: ' + savePath);
          }
          else {
            image.background(0xFFFFFFFF).contain(width,height,jimp.HORIZONTAL_ALIGN_CENTER|jimp.VERTICAL_ALIGN_MIDDLE).write(savePath);
            resolve('Image saved to: ' + savePath);
          }
        }).catch(err => reject(err));
      }
    });
  },

  selectImageWithKeyword: function(keyword,data,exact) {
    if (!keyword || !data || !(data.description || data.filename || data.title)) {
      return false;
    }
    if (exact === undefined) exact = true;
    if (this.findKeywordInSentence(keyword,data.filename,exact) || (this.findKeywordInSentence(keyword,data.description,exact) && this.findKeywordInSentence(keyword,data.title,exact))) {
      return true;
    }
    else {
      return false;
    }
  },

  selectImageWithTags: function(keyword,data,tags,exact) {
    if (!keyword || !data || !(data.description || data.filename || data.title)) {
      return false;
    }
    if (!tags) tags = [];
    if (exact === undefined) exact = true;
    if (this.findKeywordInSentence(keyword,data.filename,exact) || (this.findKeywordInSentence(keyword,data.description,exact) && this.findKeywordInSentence(keyword,data.title,exact))) {
      for (let i = 0; i < tags.length; i++) {
        if (this.findKeywordInSentence(tags[i],data.filename,exact) || (this.findKeywordInSentence(tags[i],data.description,exact) && this.findKeywordInSentence(tags[i],data.title,exact))) {
          return true;
        }
      }
      return false;
    }
    else {
      return false;
    }
  },

  googleImage: function(keyword,imageParams,domain) {
    return new Promise((resolve,reject) => {
      setTimeout(() => {
        reject('Server request timeout searching for Google image: ' + keyword);
      },this.timeout*2);
      if (!keyword || !imageParams.fallback) {
        reject('Unable to search for images without keyword and fallback image keyword.');
      }
      else {
        if (!imageParams) imageParams = {};
        if (!imageParams.options) imageParams.options = ['medium','commercial'];
        if (!imageParams.tags) imageParams.tags = [];
        if (imageParams.crop === undefined) imageParams.crop = true;
        if (imageParams.exact === undefined) imageParams.exact = true;
        if (!domain) domain = 'com.au';
        let parsedKeyword = keyword.replace(/[^a-zA-Z\s]/g,'').replace(/\s+/g,'+');
        let url = `https://www.google.${domain}/search?q=${parsedKeyword}&tbm=isch`;
        if (imageParams.options && imageParams.options.length) {
          let license = '';
          let color = '';
          let size = '';
          for (let i = 0; i < imageParams.options.length; i++) {
            switch (imageParams.options[i]) {
              case 'cc':
              if (!license) license = 'sur:f';
              break;
              case 'commercial':
              if (!license) license = 'sur:fc';
              break;
              case 'modifications':
              if (!license) license = 'sur:fmc';
              break;
              case 'red':
              if (!color) color = 'ic:specific,isc:red';
              break;
              case 'brown':
              if (!color) color = 'ic:specific,isc:brown';
              break;
              case 'orange':
              if (!color) color = 'ic:specific,isc:orange';
              break;
              case 'yellow':
              if (!color) color = 'ic:specific,isc:yellow';
              break;
              case 'green':
              if (!color) color = 'ic:specific,isc:green';
              break;
              case 'blue':
              if (!color) color = rand('ic:specific,isc:teal','ic:specific,isc:blue');
              break;
              case 'purple':
              if (!color) color = 'ic:specific,isc:purple';
              break;
              case 'pink':
              if (!color) color = 'ic:specific,isc:pink';
              break;
              case 'white':
              if (!color) color = 'ic:specific,isc:white';
              break;
              case 'grey':
              if (!color) color = 'ic:specific,isc:gray';
              break;
              case 'black':
              if (!color) color = 'ic:specific,isc:black';
              break;
              case 'bw':
              if (!color) color = 'isc:black,ic:gray';
              break;
              case 'transparent':
              case 'clear':
              case 'alpha':
              if (!color) color = 'isc:black,ic:trans';
              break;
              case 'large':
              if (!size) size = 'isz:l';
              break;
              case 'medium':
              if (!size) size = 'isz:m';
              break;
              default: break;
            }
          }
          let imageQuery = [];
          if (license) imageQuery.push(license);
          if (color) imageQuery.push(color);
          if (size) imageQuery.push(size);
          if (imageQuery.length) url += '&tbs=' + imageQuery.join(',');
        }
        let options = {
          method: 'GET',
          uri: url,
          gzip: true,
          headers: {'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:20.0) Gecko/20100101 Firefox/20.0'}
        };
        let proxy = this.googleProxy();
        if (proxy) {
          options.proxy = proxy;
        }
        else {
          if (this.debug) console.log('WARNING: Proxies currently not set.');
        }
        request(options).then(html => {
          let $ = cheerio.load(html);
          let photos = [];
          $('.rg_meta.notranslate').each(function(i,el) {
            if ($(this).text()) {
              photos.push(JSON.parse($(this).text()));
            }
          });
          if (!photos.length) {
            reject(`Unable to find Google images for keyword: ${keyword}`);
          }
          let data = [];
          for (let i = 0; i < photos.length; i++) {
            let obj = {
              title: photos[i].pt,
              description: photos[i].s,
              author: photos[i].isu,
              url: photos[i].ru,
              image: photos[i].ou,
              width: parseInt(photos[i].ow),
              height: parseInt(photos[i].oh),
              filename: path.basename(photos[i].ou.split('?')[0]),
              search: imageParams.options.join(','),
              tags: imageParams.tags.join(','),
              copyright: (!imageParams.options.includes('cc') && !imageParams.options.includes('commercial')) ? true : false
            };
            if (!imageParams.tags.length && this.selectImageWithKeyword(keyword,obj,imageParams.exact)) {
              data.push(obj);
            }
            else if (imageParams.tags.length && this.selectImageWithTags(keyword,obj,imageParams.tags,imageParams.exact)) {
              data.push(obj);
            }
          }
          if (data.length) {
            if (this.debug) console.log('Resolving Google images: ' + keyword);
            resolve(data);
          }
          else {
            if (this.debug) console.log('Resolving Google images fallback: ' + keyword);
            resolve({fallback: imageParams.fallback});
          }
        }).catch(err => reject(err));
      }
    });
  },

  flickrImage: function(keyword,imageParams) {
    return new Promise((resolve,reject) => {
      setTimeout(() => {
        reject('Server request timeout searching for Flickr image: ' + keyword);
      },this.timeout*2);
      if (!keyword || !imageParams.fallback) {
        reject('Unable to search for images without keyword and fallback image keyword.');
      }
      else {
        if (!imageParams) imageParams = {};
        if (!imageParams.options) imageParams.options = ['medium','commercial'];
        if (!imageParams.tags) imageParams.tags = [];
        if (imageParams.crop === undefined) imageParams.crop = true;
        if (imageParams.exact === undefined) imageParams.exact = true;
        if (!imageParams.page) imageParams.page = 1;
        let parsedKeyword = keyword.replace(/[^a-zA-Z\s]/g,'').replace(/\s+/g,'%20');
        let url = `https://www.flickr.com/search/?text=${parsedKeyword}&page=${imageParams.page}`;
        if (imageParams.options && imageParams.options.length) {
          let license = '';
          let color = '';
          let style = '';
          for (let i = 0; i < imageParams.options.length; i++) {
            switch (imageParams.options[i]) {
              case 'cc':
              if (!license) license = '&license=2%2C3%2C4%2C5%2C6%2C9';
              break;
              case 'commercial':
              if (!license) license = '&license=4%2C5%2C6%2C9%2C10';
              break;
              case 'modifications':
              if (!license) license = '&license=1%2C2%2C9%2C10';
              break;
              case 'red':
              if (!color) color = '&color_codes=0';
              break;
              case 'brown':
              if (!color) color = '&color_codes=1';
              break;
              case 'orange':
              if (!color) color = rand('&color_codes=2','&color_codes=3');
              break;
              case 'yellow':
              if (!color) color = '&color_codes=4';
              break;
              case 'green':
              if (!color) color = rand('&color_codes=6','&color_codes=5');
              break;
              case 'blue':
              if (!color) color = rand('&color_codes=8','&color_codes=7');
              break;
              case 'purple':
              if (!color) color = '&color_codes=9';
              break;
              case 'pink':
              if (!color) color = rand('&color_codes=a','&color_codes=b');
              break;
              case 'white':
              if (!color) color = '&color_codes=c';
              break;
              case 'grey':
              if (!color) color = '&color_codes=d';
              break;
              case 'black':
              if (!color) color = '&color_codes=e';
              break;
              case 'bw':
              if (!style) style = '&styles=blackandwhite';
              break;
              case 'dof':
              if (!style) style = '&styles=depthoffield';
              break;
              case 'minimal':
              if (!style) style = '&styles=minimalism';
              break;
              case 'pattern':
              if (!style) style = '&styles=pattern';
              break;
              default: break;
            }
          }
          url += license + color + style;
        }
        let options = {
          method: 'GET',
          uri: url,
          gzip: true,
          headers: {'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:20.0) Gecko/20100101 Firefox/20.0'}
        };
        let proxy = this.flickrProxy();
        if (proxy) {
          options.proxy = proxy;
        }
        else {
          if (this.debug) console.log('WARNING: Proxies currently not set.');
        }
        request(options).then(html => {
          html = html.replace(/(\s*\n+\s*|\s*\r+\s*)/g,'');
          let $ = cheerio.load(html);
          let tag;
          $('script').each(function(i,el) {
            if ($(this).html().match(/"photos":{"_data":.+,"fetchedStart":/)) {
              tag = $(this).html();
            }
          });
          let photos = JSON.parse(tag.match(/"photos":{"_data":.+,"fetchedStart":/)[0].replace(/null,/g,'').replace(/("photos":{"_data":|,"fetchedStart":)/g,''));
          if (!photos.length) {
            reject(`Unable to find Flickr images on page ${imageParams.page} for keyword: ${keyword}`);
          }
          let data = [];
          for (let i = 0; i < photos.length; i++) {
            let size;
            if (imageParams.options.includes('medium')) {
              if (!size) size = photos[i].sizes.l ? 'l' : '';
              if (!size) size = photos[i].sizes.m ? 'm' : '';
            }
            else {
              if (!size) size = photos[i].sizes.l ? 'l' : '';
            }
            if (!size) continue;
            let obj = {
              title: photos[i].title,
              description: photos[i].description,
              author: photos[i].realname || photos[i].username || photos[i].ownerNsid,
              url: 'https://www.flickr.com/photos/' + photos[i].pathAlias + '/' + photos[i].id,
              image: 'https:' + photos[i].sizes[size].url,
              width: parseInt(photos[i].sizes[size].width),
              height: parseInt(photos[i].sizes[size].height),
              filename: path.basename(photos[i].sizes[size].url.split('?')[0]),
              search: imageParams.options.join(','),
              tags: imageParams.tags.join(','),
              copyright: (!imageParams.options.includes('cc') && !imageParams.options.includes('commercial')) ? true : false
            };
            if (!imageParams.tags.length && this.selectImageWithKeyword(keyword,obj,imageParams.exact)) {
              data.push(obj);
            }
            else if (imageParams.tags.length && this.selectImageWithTags(keyword,obj,imageParams.tags,imageParams.exact)) {
              data.push(obj);
            }
          }
          if (data.length) {
            if (this.debug) console.log('Resolving Flickr images: ' + keyword);
            resolve(data);
          }
          else {
            if (this.debug) console.log('Resolving Flickr images fallback: ' + keyword);
            resolve({fallback: imageParams.fallback});
          }
        }).catch(err => reject(err));
      }
    });
  },

  flickrImageLoop: function(keyword,imageParams,store) {
    return new Promise((resolve,reject) => {
      if (!keyword || !imageParams.fallback) {
        reject('Unable to search for images without keyword and fallback image keyword.');
      }
      else {
        if (!imageParams.options) imageParams.options = ['medium','commercial'];
        if (!imageParams.tags) imageParams.tags = [];
        if (imageParams.crop === undefined) imageParams.crop = true;
        if (imageParams.exact === undefined) imageParams.exact = true;
        if (!imageParams.page) imageParams.page = 1;
        if (!imageParams.limit) imageParams.limit = 1;
        if (!store) store = [];
        this.flickrImage(keyword,imageParams).then(data => {
          if (!data.fallback) store = store.concat(data);
          if (store.length > imageParams.limit) {
            resolve(store);
          }
          else {
            imageParams.page++;
            if (this.debug) console.log(`Searching for Flickr images on page ${imageParams.page} for keyword: ${keyword}`);
            this.flickrImageLoop(keyword,imageParams,store).then(data => resolve(data)).catch(err => reject(err));
          }
        }).catch(err => {
          if (store.length) {
            if (this.debug) console.log(err);
            if (this.debug) console.log('Resolving Flickr image loop: ' + keyword);
            resolve(store);
          }
          else if (data.fallback) {
            if (this.debug) console.log(err);
            if (this.debug) console.log('Resolving Flickr image loop: ' + keyword);
            resolve(data);
          }
          else {
            reject(err);
          }
        });
      }
    });
  },

  images: function(keyword,imageParams) {
    return new Promise((resolve,reject) => {
      if (!keyword || !imageParams.fallback) {
        reject('Unable to search for images without keyword and fallback image keyword.');
      }
      else {
        if (!imageParams.search) imageParams.search = 'any';
        if (!imageParams.options) imageParams.options = ['medium','commercial'];
        if (!imageParams.tags) imageParams.tags = [];
        if (imageParams.crop === undefined) imageParams.crop = true;
        if (imageParams.cacheOnly === undefined) imageParams.cacheOnly = true;
        if (imageParams.exact === undefined) imageParams.exact = true;
        if (!imageParams.page) imageParams.page = 1;
        if (!imageParams.limit) imageParams.limit = 1;
        let self = this;
        let callback = function(inputData) {
          if (inputData.fallback && imageParams.search === 'flickr') imageParams.search === 'google';
          if (inputData.fallback) {
            if (this.debug) console.log('No matching images for: ' + keyword);
            if (this.debug) console.log('Searching for images for fallback: ' + inputData.fallback);
            self.images(inputData.fallback,imageParams).then(data => resolve(data)).catch(err => reject(err));
          }
          else {
            self.updateImageCacheMultiple(inputData,keyword,imageParams.crop,imageParams.limit).then(msg => {
              if (this.debug) console.log(msg);
              self.readImageCache(keyword).then(outputData => {
                let images = shuffle(JSON.parse(outputData));
                let filtered = [];
                for (let i = 0; i < imageParams.limit; i++) {
                  if (images[i]) filtered.push(images[i]);
                }
                if (this.debug) console.log('Resolving images: ' + keyword);
                resolve(filtered);
              }).catch(err => reject(err));
            }).catch(err => reject(err));
          }
        };
        if (imageParams.cacheOnly) {
          this.readImageCache(keyword).then(data => {
            let images = shuffle(JSON.parse(data));
            let filtered = [];
            for (let i = 0; i < imageParams.limit; i++) {
              if (images[i]) filtered.push(images[i]);
            }
            if (this.debug) console.log('Resolving images: ' + keyword);
            resolve(filtered);
          }).catch(error => {
            if (this.debug) console.log(error);
            if (this.debug) console.log('No images found. Searching for new images...');
            if (imageParams.search === 'google') {
              this.googleImage(keyword,imageParams).then(data => callback(data)).catch(err => reject(err));
            }
            else if (imageParams.search === 'flickr') {
              this.flickrImageLoop(keyword,imageParams).then(data => callback(data)).catch(err => reject(err));
            }
            else {
              if (rand(true,false) === true) {
                this.googleImage(keyword,imageParams).then(data => callback(data)).catch(err => reject(err));
              }
              else {
                this.flickrImageLoop(keyword,imageParams).then(data => callback(data)).catch(err => reject(err));
              }
            }
          });
        }
        else {
          if (imageParams.search === 'google') {
            this.googleImage(keyword,imageParams).then(data => callback(data)).catch(err => reject(err));
          }
          else if (imageParams.search === 'flickr') {
            this.flickrImageLoop(keyword,imageParams).then(data => callback(data)).catch(err => reject(err));
          }
          else {
            if (rand(true,false) === true) {
              this.googleImage(keyword,imageParams).then(data => callback(data)).catch(err => reject(err));
            }
            else {
              this.flickrImageLoop(keyword,imageParams).then(data => callback(data)).catch(err => reject(err));
            }
          }
        }
      }
    });
  },

  matchUrl: function(paragraph,url) {
    if (!paragraph || !url || typeof paragraph !== 'string' || typeof url !== 'string') {
      return false;
    }
    url = url.replace(/(http|https)(\:\/\/)(www\.)*([a-z\-]+)(.)+/,'$4');
    paragraph = paragraph.replace(/[^A-Za-z\-]/gi,'').toLowerCase();
    if (paragraph.includes(url)) return true;
    return false;
  },

  parseHeader: function(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    text = text
    .replace(/^(\n|\s|\r|\t)+/g,'')
    .replace(/(\n|\s|\r|\t)+$/g,'')
    .replace(/(\n|\r|\t|\s+)/g,' ')
    .replace(/^[^A-Za-z]*([A-Za-z])/,'$1')
    .replace(/([a-zA-Z])(\:\s.+|\s\(.+|\s\-\s.+|\s\|\s.+|\,\s.+)/,'$1')
    .replace(/(\u201C|\u201D|\u2033|\u201e)/g,'"')
    .replace(/(\u2018|\u2019|\u201a|\u2032)/g,'\'')
    .replace(/(\u2026)/g,'.')
    .replace(/[\.\?\!]$/,'');
    if (text) return pos.titlecase(text);
    return '';
  },

  parseText: function(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    text = text
    .replace(/^(\n|\s|\r|\t)+/g,'')
    .replace(/(\n|\s|\r|\t)+$/g,'')
    .replace(/(\n|\r|\t|\s+)/g,' ')
    .replace(/\[\d+\]/g,'')
    .replace(/\!+/g,'!')
    .replace(/\?+/g,'?')
    .replace(/\.+/g,'.')
    .replace(/^[^A-Z]*([A-Z])/,'$1')
    .replace(/(.*)(\:\s|\s\-\s)([A-Z].+)/,'$3')
    .replace(/(Dr|St|Rd|Mr|Ms|Mrs)\./g,'$1')
    .replace(/(\s[A-Za-z])\./g,'$1')
    .replace(/\.([0-9])/g,' point $1')
    .replace(/\.([A-Z]|[a-z])/g,'$1')
    .replace(/([a-z])(A\s)/g,'$1. $2')
    .replace(/\s+/g,' ')
    .replace(/(\u201C|\u201D|\u2033|\u201e)/g,'"')
    .replace(/(\u2018|\u2019|\u201a|\u2032)/g,'\'')
    .replace(/(\u2026)/g,'.')
    .replace(/([\!\?\.])\s*(\w)/g,'$1|||||$2');
    if (text) return text;
    return '';
  },

  validateHeader: function(sentence,url) {
    if (!sentence || !url || typeof sentence !== 'string' || typeof url !== 'string') {
      return false;
    }
    if (sentence.match(/[a-z][A-Z]/)) return false;
    if (sentence.match(/[^a-zA-Z\s\,\/\-0-9]/)) return false;
    if (!sentence.match(/^[A-Z]/)) return false;
    if (this.matchUrl(sentence,url)) return false;
    if (sentence.match(/\b(we|our|us|ourselves|ourself|i|my|me|myself)\b/i)) return false;
    if (sentence.match(/\b(today|tomorrow|yesterday|last\sweek|last\smonth|last\syear|next\sweek|next\smonth|next\syear|this\sweek|this\smonth|this\syear)\b/i)) return false;
    if (sentence.match(/\b(error|problem|issue|trouble|unable)/i) && sentence.match(/\b(server|request|response|page|web|gateway|data|loading|load|open|opening)\b/i)) return false;
    if (sentence.match(/\b(please|thanks|thankyou|thank\syou|hello|hi|hey|greetings|welcome|goodbye|bye)\b/i)) return false;
    if (sentence.match(/(shit|fuck|dick|piss|cunt|bitch|bastard)/i)) return false;
    if (sentence.match(/\b(posts|articles|comments|videos|related|reviews|answers|questions|replies|products|pages|items|similar|popular|category|categories|ratings|responses)\b/)) return false;
    if (sentence.match(/\b(post|write|leave|make|send|reply|respond)\b/i) && sentence.match(/\b(comment|reply|message|email|article|post|review)\b/i)) return false;
    if (sentence.match(/\b(subscribe|join|sign\sup|signup|become)\b/i) && sentence.match(/\b(free|newsletter|updates|news|email|membership|course|program|subscriber|member)\b/i)) return false;
    return true;
  },

  validateText: function(sentence,url) {
    if (!sentence || !url || typeof sentence !== 'string' || typeof url !== 'string') {
      return false;
    }
    if (sentence.match(/[a-z][A-Z]/)) return false;
    if (sentence.match(/[\.\,\?\!\;\&\/][\.\,\?\!\;\&\/]/)) return false;
    if (!sentence.match(/[\!\.\?\"]$/)) return false;
    if (!sentence.match(/^[A-Z\"]/)) return false;
    if (!sentence.match(/\s[a-z]/)) return false;
    if (sentence.match(/[\%\$]/)) return false;
    if (this.matchUrl(sentence,url)) return false;
    if (sentence.match(/\b(we|our|us|ourselves|ourself|i|my|me|myself)\b/i)) return false;
    if (sentence.match(/\b(today|tomorrow|yesterday|last\sweek|last\smonth|last\syear|next\sweek|next\smonth|next\syear|this\sweek|this\smonth|this\syear)\b/i)) return false;
    if (sentence.match(/\b(error|problem|issue|trouble|unable)/i) && sentence.match(/\b(server|request|response|page|web|gateway|data|loading|load|open|opening)\b/i)) return false;
    if (sentence.match(/\b(please|thanks|thankyou|thank\syou|hello|hi|hey|greetings|welcome|goodbye|bye)\b/i)) return false;
    if (sentence.match(/(shit|fuck|dick|piss|cunt|bitch|bastard)/i)) return false;
    return true;
  },

  findKeywordInSentence: function(keyword,sentence,exact,minCount) {
    if (!keyword || typeof keyword !== 'string' || !sentence || typeof sentence !== 'string') {
      return false;
    }
    if (exact === undefined) exact = true;
    if (!minCount) minCount = 0;
    let lowercasedKeyword = keyword.replace(/[^\w]/gi,' ').replace(/\s+/g,' ').trim().toLowerCase();
    let lowercasedSentence = sentence.toLowerCase();
    if (lowercasedSentence.includes(lowercasedKeyword)) return true;
    let matches = 0;
    let splitKeyword = lowercasedKeyword.split(' ');
    for (let i = 0; i < splitKeyword.length; i++) {
      if (lowercasedSentence.includes(splitKeyword[i])) matches++;
    }
    if ((exact && matches === splitKeyword.length) || (!exact && matches > minCount)) {
      return true;
    }
    else {
      return false;
    }
  },

  headerFromKeywordList: function(header,keywordList) {
    if (!header || typeof header !== 'string' || !keywordList || typeof keywordList !== 'object') {
      return '';
    }
    let lowercasedHeader = header.toLowerCase();
    let letter = lowercasedHeader[0];
    if (!keywordList[letter]) return '';
    let searchKeywords = keywordList[letter];
    for (let i = 0; i < searchKeywords.length; i++) {
      if (lowercasedHeader.includes(searchKeywords[i])) return searchKeywords[i];
    }
    return '';
  },

  textFromKeywordList: function(text,keywordList) {
    if (!text || typeof text !== 'string' || !keywordList || typeof keywordList !== 'object') {
      return false;
    }
    for (let i = 0; i < keywordList.length; i++) {
      if (this.findKeywordInSentence(keywordList[i],text,true)) return true;
    }
    return false;
  },

  findContextFromLink: function(template,link) {
    if (!template || typeof template !== 'string' || !link || !link.url || !link.text) {
      return false;
    }
    let regex;
    switch (template) {
      case 'tips':
      regex = /\b(tips|how.to|ideas)\b/i;
      if (link.url.match(regex) || link.text.match(regex)) return true;
      return false;
      case 'facts':
      regex = /\b(facts|info|information)\b/i;
      if (link.url.match(regex) || link.text.match(regex)) return true;
      case 'myths':
      regex = /\b(myths|misconceptions)\b/i;
      if (link.url.match(regex) || link.text.match(regex)) return true;
      case 'list':
      regex = /\b(list|best|top|\d\s\w|\d-\w)\b/i;
      if (link.url.match(regex) || link.text.match(regex)) return true;
      return false;
      case 'product':
      regex = /\b(\d\d)\b/i;
      if (link.url.match(regex) || link.text.match(regex)) return true;
      return false;
      case 'review':
      regex = /\b(review)\b/i;
      if (link.url.match(regex) || link.text.match(regex)) return true;
      return false;
      default: return false;
    }
  },

  filterBodyContent: function(paragraph,url) {
    if (!paragraph || !url || typeof paragraph !== 'string' || typeof url !== 'string') {
      return [];
    }
    let splitParagraph = paragraph.split('|||||');
    let filtered = [];
    for (let i = 0; i < splitParagraph.length; i++) {
      if (this.validateText(splitParagraph[i],url)) filtered.push(splitParagraph[i]);
    }
    if (filtered.length) return filtered;
    return [];
  },

  extractBodyContent: function($,url,filterText) {
    let title = this.parseHeader($('h1').first().text().trim() || $('h2').first().text().trim() || '');
    let main = '';
    let headers = [];
    $('p').each(function(i,el) {
      if ($(this).parent().text().trim().length > main.length) main = $(this).parent().text().trim();
    });
    $('h1').each(function(i,el) {
      headers.push($(this).text().trim());
    });
    $('h2').each(function(i,el) {
      headers.push($(this).text().trim());
    });
    $('h3').each(function(i,el) {
      headers.push($(this).text().trim());
    });
    $('h4').each(function(i,el) {
      headers.push($(this).text().trim());
    });
    $('h5').each(function(i,el) {
      headers.push($(this).text().trim());
    });
    $('h6').each(function(i,el) {
      headers.push($(this).text().trim());
    });
    $('strong').each(function(i,el) {
      headers.push($(this).text().trim());
    });
    let paragraphs = main.split('\n');
    let objs = [];
    for (let i = 0; i < paragraphs.length; i++) {
      if (headers.includes(paragraphs[i])) {
        objs.push({type: 'header', content: this.parseHeader(paragraphs[i])});
      }
      else if (paragraphs[i]) {
        objs.push({type: 'text', content: this.parseText(paragraphs[i])});
      }
    }
    let content = [];
    let lastHeader = '';
    for (let i = 0; i < objs.length; i++) {
      if (objs[i].type === 'text') {
        content.push({text: objs[i].content, header: lastHeader});
      }
      else if (objs[i].type === 'header') {
        lastHeader = objs[i].content;
      }
    }
    let filteredObjs = [];
    for (let i = 0; i < content.length; i++) {
      let filtered;
      if (filterText || typeof filterText === 'undefined') {
        filtered = this.filterBodyContent(content[i].text,url);
      }
      else {
        filtered = content[i].text.split('|||||');
      }
      if (filtered.length) {
        filteredObjs.push({text: filtered, header: content[i].header});
      }
    }
    return {content: filteredObjs, title: title, headers: headers};
  },

  webpage: function(url,filterText) {
    return new Promise((resolve,reject) => {
      setTimeout(() => {
        reject('Server request timeout loading url: ' + url);
      },this.timeout);
      let options = {
        method: 'GET',
        uri: url,
        gzip: true,
        rejectUnauthorized: false,
        headers: {'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:20.0) Gecko/20100101 Firefox/20.0'}
      };
      request(options).then(html => {
        let $ = cheerio.load(html);
        let pageObject = {};
        pageObject.title = $('title').text() || '';
        pageObject.description = $('meta[name="description"]').attr('content') || '';
        pageObject.keywords = $('meta[name="keywords"]').attr('content') || '';
        pageObject.url = url;
        pageObject.body = this.extractBodyContent($,url,filterText);
        if (this.debug) console.log('Resolving webpage: ' + url);
        resolve(pageObject);
      }).catch(err => reject(err));
    });
  },

  firstParagraph: function(obj,keyword) {
    if (!obj || !obj.body.content.length) {
      return null;
    }
    let data = obj.body.content;
    let paragraph = null;
    for (let i = 0; i < data.length; i++) {
      if (!data[i].header) {
        if (!paragraph && data[i].text.length) {
          paragraph = {text: data[i].text, header: data[i].header, keyword: false, url: obj.url};
        }
        else if (paragraph.text.length && data[i].text.length) {
          paragraph.text = paragraph.text.concat(data[i].text);
        }
      }
      else {
        break;
      }
    }
    if (paragraph && paragraph.text && paragraph.text.length && keyword && paragraph.text.join(' ').toLowerCase().includes(keyword.toLowerCase())) {
      return paragraph;
    }
    else if (paragraph && paragraph.text && paragraph.text.length && keyword) {
      return null;
    }
    else {
      return paragraph;
    }
  },

  randomParagraph: function(obj,count,headerKeywords,textKeywords,usedKeywords) {
    if (!obj || !obj.body.content.length) {
      return [];
    }
    if (!count) count = 1;
    if (!headerKeywords) headerKeywords = null;
    if (!textKeywords) textKeywords = [];
    if (!usedKeywords) usedKeywords = [];
    let paragraphs = [];
    let data = obj.body.content;
    data = shuffle(data);
    for (let i = 0; i < data.length; i++) {
      if (paragraphs.length < count) {
        if (data[i].header) {
          if (headerKeywords && textKeywords.length) {
            let headerMatch = this.headerFromKeywordList(data[i].header,headerKeywords);
            if (headerMatch && usedKeywords.length && usedKeywords.includes(headerMatch)) continue;
            let textMatch = this.textFromKeywordList(data[i].text.join(' '),textKeywords);
            if (!textMatch) continue;
            let paragraph = {
              text: data[i].text,
              header: headerMatch ? pos.titlecase(headerMatch) : data[i].header,
              keyword: headerMatch ? true : false,
              url: obj.url
            };
            paragraphs.push(paragraph);
          }
          else if (headerKeywords) {
            let headerMatch = this.headerFromKeywordList(data[i].header,headerKeywords);
            if (headerMatch && usedKeywords.length && usedKeywords.includes(headerMatch)) continue;
            let paragraph = {
              text: data[i].text,
              header: headerMatch ? pos.titlecase(headerMatch) : data[i].header,
              keyword: headerMatch ? true : false,
              url: obj.url
            };
            paragraphs.push(paragraph);
          }
          else if (textKeywords.length) {
            let textMatch = this.textFromKeywordList(data[i].text.join(' '),textKeywords);
            if (!textMatch) continue;
            let paragraph = {
              text: data[i].text,
              header: data[i].header,
              keyword: false,
              url: obj.url
            };
            paragraphs.push(paragraph);
          }
          else {
            paragraphs.push({text: data[i].text, header: data[i].header, keyword: false, url: obj.url});
          }
        }
        else {
          continue;
        }
      }
      else {
        break;
      }
    }
    return paragraphs;
  },

  resultLinks: function($,searchSource) {
    let links = [];
    if (searchSource === 'google') {
      $('h3 a').each(function(i,el) {
        if ($(this).attr('href').match(/(http:|https:)/)) {
          let url = $(this).attr('href');
          let text = $(this).text();
          links.push({url: url, text: text});
        }
      });
    }
    else if (searchSource === 'bing') {
      $('h2 a').each(function(i,el) {
        if ($(this).attr('href').match(/(http:|https:)/)) {
          let url = $(this).attr('href');
          let text = $(this).text();
          links.push({url: url, text: text});
        }
      });
    }
    return links;
  },

  googleSearch: function(keyword,minResult,maxResult,domain) {
    return new Promise((resolve,reject) => {
      setTimeout(() => {
        reject('Server request timeout searching for: ' + keyword);
      },this.timeout);
      if (!keyword) {
        reject('Unable to search without keyword.');
      }
      else {
        this.lastWebSearch = 'google';
        if (!minResult) minResult = 1;
        if (!maxResult) maxResult = minResult;
        if (!domain) domain = 'com.au';
        let parsedKeyword = keyword.replace(/\s/g,'+');
        let queryPage = Math.floor(Math.random() * maxResult) + minResult;
        let url = `https://www.google.${domain}/search?q=${parsedKeyword}`;
        if (queryPage > 10) url += `&start=${queryPage-1}`;
        let options = {
          method: 'GET',
          uri: url,
          gzip: true,
          headers: {'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:20.0) Gecko/20100101 Firefox/20.0'}
        };
        let proxy = this.googleProxy();
        if (proxy) {
          options.proxy = proxy;
        }
        else {
          if (this.debug) console.log('WARNING: Proxies currently not set.');
        }
        request(options).then(html => {
          if (this.debug) console.log('Searching Google for keyword: ' + keyword + ' - ' + minResult);
          let $ = cheerio.load(html);
          let results = this.resultLinks($,'google');
          if (this.debug) console.log('Resolving Google search: ' + keyword);
          resolve(results);
        }).catch(err => reject(err));
      }
    });
  },

  bingSearch: function(keyword,minResult,maxResult,domain) {
    return new Promise((resolve,reject) => {
      setTimeout(() => {
        reject('Server request timeout searching for: ' + keyword);
      },this.timeout);
      if (!keyword) {
        reject('Unable to search without keyword.');
      }
      else {
        this.lastWebSearch = 'bing';
        if (!minResult) minResult = 1;
        if (!maxResult) maxResult = minResult;
        if (!domain) domain = 'au';
        let parsedKeyword = keyword.replace(/\s/g,'+');
        let queryPage = Math.floor(Math.random() * maxResult) + minResult;
        let url = `https://www.bing.com/search?q=${parsedKeyword}&cc=${domain}`;
        if (queryPage > 10) url += `&first=${queryPage}`;
        let options = {
          method: 'GET',
          uri: url,
          gzip: true,
          headers: {'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:20.0) Gecko/20100101 Firefox/20.0'}
        };
        let proxy = this.bingProxy();
        if (proxy) {
          options.proxy = proxy;
        }
        else {
          if (this.debug) console.log('WARNING: Proxies currently not set.');
        }
        request(options).then(html => {
          if (this.debug) console.log('Searching Bing for keyword: ' + keyword + ' - ' + minResult);
          let $ = cheerio.load(html);
          let results = this.resultLinks($,'bing');
          if (this.debug) console.log('Resolving Bing search: ' + keyword);
          resolve(results);
        }).catch(err => reject(err));
      }
    });
  },

  search: function(keyword,minResult,maxResult,googleDomain,bingDomain) {
    return new Promise((resolve,reject) => {
      setTimeout(() => {
        reject('Server request timeout searching for: ' + keyword);
      },this.timeout);
      if (!keyword) {
        reject('Unable to search without keyword.');
      }
      else {
        if (this.lastWebSearch !== 'google') {
          this.googleSearch(keyword,minResult,maxResult,googleDomain).then(data => resolve(data)).catch(err => reject(err));
        }
        else {
          this.bingSearch(keyword,minResult,maxResult,bingDomain).then(data => resolve(data)).catch(err => reject(err));
        }
      }
    });
  },

  imageCredit: function(image) {
    if (!image) {
      return;
    }
    let credit = [];
    if (image.title) credit.push(image.title);
    if (image.author) credit.push('by ' + image.author);
    if (image.url) credit.push('from ' + image.url);
    if (credit.length) {
      return credit.join(' ');
    }
    else {
      return '';
    }
  },

  videoProperties: function(obj,imageParams,fallbackImages,keywordStore,pageStore) {
    return new Promise((resolve,reject) => {
      if (!obj || !imageParams || !imageParams.fallback || !fallbackImages.length) {
        reject('Unable to create video properties without page object and fallback image data.');
      }
      else {
        if (!imageParams.type) imageParams.type = 'intro';
        if (!imageParams.template) imageParams.template = '';
        if (!imageParams.search) imageParams.search = 'google';
        if (!imageParams.options) imageParams.options = ['medium','commercial'];
        if (!imageParams.tags) imageParams.tags = [];
        if (imageParams.crop === undefined) imageParams.crop = true;
        if (imageParams.cacheOnly === undefined) imageParams.cacheOnly = true;
        if (imageParams.exact === undefined) imageParams.exact = true;
        if (!imageParams.limit) imageParams.limit = 1;
        if (!keywordStore) keywordStore = [];
        if (!pageStore) pageStore = [];
        let slides = [];
        let credits = [];
        let useFallback = obj.keyword ? false : true;
        let keyword = useFallback ? imageParams.fallback : obj.header.toLowerCase();
        if (!useFallback && keywordStore.includes(keyword)) reject('Duplicate keyword found: ' + keyword);
        if (this.objectInArray(obj,pageStore)) {
          reject('Duplicate page content found: ' + keyword);
        }
        else {
          pageStore.push(obj);
        }
        let duplicateKeyword = false;
        if (keywordStore.includes(keyword)) {
          duplicateKeyword = true;
        }
        else {
          keywordStore.push(keyword);
        }
        let description = imageParams.type === 'intro' ? pos.prettyPrint(obj.text.join(' '),true,true,false) : obj.header + '\n\n' + pos.prettyPrintList(obj.text.join(' '),true,true,true);
        if (useFallback) imageParams.cacheOnly = true;
        this.images(keyword,imageParams).then(data => {
          let imageActive = true;
          let textActive = true;
          if (imageParams.template === 'imageOnly' || duplicateKeyword) textActive = false;
          if (imageParams.template === 'textOnly') imageActive = false;
          let bothActive = imageActive && textActive ? true : false;
          let titleText, titleImage;
          if (bothActive) {
            if (useFallback) {
              titleImage = fallbackImages[0] ? rand(fallbackImages[0],null,null,null) : null;
              if (titleImage) fallbackImages.shift();
            }
            else {
              titleImage = data[0] ? rand(data[0],null,null,null) : null;
              if (titleImage) data.shift();
            }
            titleText = obj.header;
          }
          else if (imageActive) {
            if (useFallback) {
              titleImage = fallbackImages[0] ? fallbackImages[0] : null;
              if (titleImage) fallbackImages.shift();
            }
            else {
              titleImage = data[0] ? data[0] : null;
              if (titleImage) data.shift();
            }
            titleText = '';
          }
          else if (textActive) {
            titleImage = null;
            titleText = obj.header;
          }
          let titleObj = {
            text: titleText,
            audio: '',
            image: titleImage,
            template: imageParams.template,
            keyword: keyword,
            url: obj.url
          };
          let titleCredit = this.imageCredit(titleObj.image);
          if (titleCredit && !titleObj.image.copyright) credits.push(titleCredit);
          if (titleObj.text || titleObj.image) slides.push(titleObj);
          for (let i = 0; i < obj.text.length; i++) {
            let slideText, slideImage;
            let snippet = pos.prettyPrintSnippet(obj.text[i],false,true,false);
            if (bothActive) {
              if (useFallback) {
                slideImage = fallbackImages[0] ? rand(fallbackImages[0],fallbackImages[0],fallbackImages[0],null) : null;
                if (slideImage) fallbackImages.shift();
              }
              else {
                slideImage = data[0] ? rand(data[0],data[0],data[0],null) : null;
                if (slideImage) data.shift();
              }
              slideText = !slideImage ? snippet : rand(snippet,'');
            }
            else if (imageActive) {
              if (useFallback) {
                slideImage = fallbackImages[0] ? fallbackImages[0] : null;
                if (slideImage) fallbackImages.shift();
              }
              else {
                slideImage = data[0] ? data[0] : null;
                if (slideImage) data.shift();
              }
              slideText = '';
            }
            else if (textActive) {
              slideImage = null;
              slideText = snippet;
            }
            let slideObj = {
              text: slideText,
              audio: obj.text[i],
              image: slideImage,
              template: imageParams.template,
              keyword: keyword,
              url: obj.url
            };
            let slideCredit = this.imageCredit(slideObj.image);
            if (slideCredit && !slideObj.image.copyright) credits.push(slideCredit);
            if (slideObj.text || slideObj.image) slides.push(slideObj);
          }
          if (slides.length) {
            if (this.debug) console.log('Resolving video properties: ' + keyword);
            resolve({slides: slides, credits: credits, description: description});
          }
          else {
            reject('No video properties found from: ' + obj.url);
          }
        }).catch(err => reject(err));
      }
    });
  },

  videoSlides: function(searchParams,imageParams,fallbackImages,keywordStore,pageStore,objectStore,slideStore) {
    return new Promise((resolve,reject) => {
      if (!searchParams || !searchParams.url || !imageParams || !imageParams.fallback) {
        reject('Unable to create video properties without page object and fallback image keyword.');
      }
      else if (!fallbackImages || !fallbackImages.length) {
        reject('No fallback images found.');
      }
      else {
        if (!searchParams.count) searchParams.count = 1;
        if (searchParams.exact === undefined) searchParams.exact = true;
        if (!imageParams.type) imageParams.type = 'intro';
        if (!searchParams.headerKeywords) searchParams.headerKeywords = null;
        if (!searchParams.textKeywords) searchParams.textKeywords = [];
        if (!imageParams.template) imageParams.template = '';
        if (!imageParams.search) imageParams.search = 'google';
        if (!imageParams.options) imageParams.options = ['medium','commercial'];
        if (!imageParams.tags) imageParams.tags = [];
        if (imageParams.crop === undefined) imageParams.crop = true;
        if (imageParams.cacheOnly === undefined) imageParams.cacheOnly = false;
        if (imageParams.exact === undefined) imageParams.exact = true;
        if (!imageParams.limit) imageParams.limit = 1;
        if (imageParams.match === undefined) imageParams.match = true;
        if (!keywordStore) keywordStore = [];
        if (!pageStore) pageStore = [];
        if (!objectStore) objectStore = [];
        if (!slideStore) slideStore = {
          count: 0,
          slides: [],
          description: [],
          credits: []
        };
        setTimeout(() => {
          reject('Server request timeout out at: ' + searchParams.url);
        },this.timeout);
        if (imageParams.type === 'intro') {
          this.webpage(searchParams.url).then(data => {
            if (!data.body.content.length) reject('No text content found at: ' + searchParams.url);
            let obj = this.firstParagraph(data);
            if (!obj.text.length) reject('No text content found at: ' + searchParams.url);
            this.videoProperties(obj,imageParams,fallbackImages,keywordStore,pageStore).then(data => {
              slideStore.count++;
              slideStore.slides = slideStore.slides.concat(data.slides);
              slideStore.credits = slideStore.credits.concat(data.credits);
              slideStore.description = data.description;
              resolve(slideStore);
            }).catch(err => reject(err));
          }).catch(err => reject(err));
        }
        else if (imageParams.type === 'random') {
          if (!slideStore.slides.length) {
            this.webpage(searchParams.url).then(data => {
              if (!data.body.content.length) reject('No text content found at: ' + searchParams.url);
              objectStore = this.randomParagraph(data,searchParams.count,searchParams.headerKeywords,searchParams.textKeywords,keywordStore);
              if (!objectStore.length) reject('No text content found at: ' + searchParams.url);
              this.videoProperties(objectStore[0],imageParams,fallbackImages,keywordStore,pageStore).then(data => {
                slideStore.count++;
                slideStore.slides = slideStore.slides.concat(data.slides);
                slideStore.credits = slideStore.credits.concat(data.credits);
                slideStore.description.push(data.description);
                objectStore.shift();
                this.videoSlides(searchParams,imageParams,fallbackImages,keywordStore,pageStore,objectStore,slideStore).then(data => resolve(data)).catch(err => reject(err));
              }).catch(err => reject(err));
            }).catch(err => reject(err));
          }
          else if (objectStore.length) {
            this.videoProperties(objectStore[0],imageParams,keywordStore,pageStore).then(data => {
              slideStore.count++;
              slideStore.slides = slideStore.slides.concat(data.slides);
              slideStore.credits = slideStore.credits.concat(data.credits);
              slideStore.description.push(data.description);
              objectStore.shift();
              this.videoSlides(searchParams,imageParams,fallbackImages,keywordStore,pageStore,objectStore,slideStore).then(data => resolve(data)).catch(err => reject(err));
            }).catch(err => reject(err));
          }
          else {
            if (this.debug) console.log('Resolving video slides: ' + searchParams.url);
            slideStore.description = slideStore.description.join('\n');
            resolve(slideStore);
          }
        }
        else {
          reject('Invalid video image type argument for: ' + searchParams.url);
        }
      }
    });
  },

  video: function(keyword,searchParams,imageParams,dataStore,index) {
    return new Promise((resolve,reject) => {
      if (!keyword) {
        reject('Unable to create video without keyword.');
      }
      else {
        if (!searchParams) searchParams = {};
        if (!searchParams.minResult) searchParams.minResult = 1;
        if (!searchParams.maxResult) searchParams.maxResult = 1;
        if (searchParams.maxResult < searchParams.minResult) searchParams.maxResult = searchParams.minResult;
        if (!searchParams.minSections) searchParams.minSections = 5;
        if (!searchParams.maxSections) searchParams.maxSections = 10;
        if (!searchParams.maxTries) searchParams.maxTries = 10;
        if (!searchParams.template) searchParams.template = 'facts';
        if (!searchParams.count) searchParams.count = 1;
        if (!searchParams.category) searchParams.category = 0;
        if (!searchParams.privacy) searchParams.privacy = 'Public';
        if (searchParams.exact === undefined) searchParams.exact = true;
        if (!searchParams.headerKeywords) searchParams.headerKeywords = null;
        if (!searchParams.textKeywords) searchParams.textKeywords = [];
        if (!imageParams) imageParams = {};
        if (!imageParams.type) imageParams.type = 'random';
        if (!imageParams.fallback) imageParams.fallback = keyword;
        if (!imageParams.template) imageParams.template = '';
        if (!imageParams.search) imageParams.search = 'google';
        if (!imageParams.options) imageParams.options = ['medium','commercial'];
        if (!imageParams.tags) imageParams.tags = [];
        if (imageParams.crop === undefined) imageParams.crop = true;
        if (imageParams.cacheOnly === undefined) imageParams.cacheOnly = true;
        if (imageParams.exact === undefined) imageParams.exact = true;
        if (!imageParams.limit) imageParams.limit = 1;
        if (!dataStore) {
          let sections = Math.floor(Math.random() * searchParams.maxSections) + searchParams.minSections;
          let title = pos.title(keyword,sections,searchParams.template);
          dataStore = {
            title: title,
            sections: sections,
            description: '',
            privacy: searchParams.privacy,
            category: searchParams.category,
            clips: [],
            rawSlides: [],
            rawCredits: [],
            rawDescription: [],
            links: [],
            keywords: [],
            pages: [],
            fallbackImages: []
          };
        }
        if (!index) index = 0;
        if (!dataStore.fallbackImages.length) {
          let fallbackImageParams = imageParams;
          fallbackImageParams.limit = 20;
          if (this.debug) console.log('Retrieving images for fallback keyword: ' + imageParams.fallback);
          this.images(imageParams.fallback,fallbackImageParams).then(fallbackImages => {
            if (!fallbackImages.length) reject('No images found for fallback keyword: ' + imageParams.fallback);
            if (this.debug) console.log('Finished retrieving images for fallback keyword: ' + imageParams.fallback);
            dataStore.fallbackImages = fallbackImages;
            this.video(keyword,searchParams,imageParams,dataStore,index).then(data => resolve(data)).catch(err => reject(err));
          }).catch(err => reject(err));
        }
        else if (!dataStore.links.length) {
          this.search(keyword,searchParams.minResult,searchParams.maxResult).then(urls => {
            urls = shuffle(urls);
            dataStore.links = dataStore.links.concat(urls);
            this.video(keyword,searchParams,imageParams,dataStore,index).then(data => resolve(data)).catch(err => reject(err));
          }).catch(err => {
            searchParams.minResult += 10;
            this.video(keyword,searchParams,imageParams,dataStore,index).then(data => resolve(data)).catch(err => reject(err));
          });
        }
        else if (!dataStore.rawSlides.length) {
          let search = searchParams;
          search.url = dataStore.links[0].url;
          let image = imageParams;
          image.type = 'intro';
          this.videoSlides(search,image,dataStore.fallbackImages,dataStore.keywords,dataStore.pages).then(slides => {
            dataStore.links.shift();
            dataStore.rawSlides = dataStore.rawSlides.concat(slides.slides);
            dataStore.rawCredits = dataStore.rawCredits.concat(slides.credits);
            dataStore.rawDescription.push(slides.description);
            if (!dataStore.links.length) searchParams.minResult += 10;
            this.video(keyword,searchParams,imageParams,dataStore,index).then(data => resolve(data)).catch(err => reject(err));
          }).catch(err => {
            if (this.debug) console.log(err);
            dataStore.links.shift();
            if (!dataStore.links.length) searchParams.minResult += 10;
            this.video(keyword,searchParams,imageParams,dataStore,index).then(data => resolve(data)).catch(err => reject(err));
          });
        }
        else if (index < dataStore.sections) {
          if ((index + searchParams.count) > dataStore.sections) searchParams.count = dataStore.sections-index;
          let search = searchParams;
          search.url = dataStore.links[0].url;
          let image = imageParams;
          image.type = 'random';
          this.videoSlides(search,image,dataStore.fallbackImages,dataStore.keywords,dataStore.pages).then(slides => {
            dataStore.links.shift();
            dataStore.rawSlides = dataStore.rawSlides.concat(slides.slides);
            dataStore.rawCredits = dataStore.rawCredits.concat(slides.credits);
            dataStore.rawDescription.push(slides.description);
            index += slides.count;
            if (!dataStore.links.length) searchParams.minResult += 10;
            this.video(keyword,searchParams,imageParams,dataStore,index).then(data => resolve(data)).catch(err => reject(err));
          }).catch(err => {
            if (this.debug) console.log(err);
            dataStore.links.shift();
            if (!dataStore.links.length) searchParams.minResult += 10;
            this.video(keyword,searchParams,imageParams,dataStore,index).then(data => resolve(data)).catch(err => reject(err));
          });
        }
        else {
          if (this.debug) console.log(dataStore.keywords);
          dataStore.clips = dataStore.rawSlides;
          if (dataStore.rawCredits.length) {
            dataStore.description = dataStore.rawDescription.join('\n') + '\nImage Credits\n' + dataStore.rawCredits.join('\n');
          }
          else {
            dataStore.description = dataStore.rawDescription.join('\n');
          }
          delete dataStore.rawSlides;
          delete dataStore.rawCredits;
          delete dataStore.rawDescription;
          delete dataStore.links;
          delete dataStore.keywords;
          delete dataStore.pages;
          delete dataStore.fallbackImages;
          if (this.debug) console.log('Resolving video: ' + keyword);
          resolve(dataStore);
        }
      }
    });
  }

};

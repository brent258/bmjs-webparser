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
  lastAmazonProxy: '',
  lastWebSearch: '',
  imageBlacklist: [],
  textBlacklist: [],
  imageQueue: {list: [], data: []},
  textQueue: {list: [], data: []},
  blacklistQueue: {list: [], data: []},
  keywords: require('./lib/keywords.js'),
  timeout: 10000,
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
    this.lastAmazonProxy = '';
    this.lastWebSearch = '';
    this.imageBlacklist = [];
    this.textBlacklist = [];
    this.imageQueue = {list: [], data: []};
    this.textQueue = {list: [], data: []};
    this.blacklistQueue = {list: [], data: []};
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

  amazonProxy: function() {
    if (!this.lastAmazonProxy) {
      this.lastAmazonProxy = this.proxies[0] || undefined;
    }
    else if (this.proxies.length && this.proxies.indexOf(this.lastAmazonProxy) < this.proxies.length-1) {
      this.lastAmazonProxy = this.proxies[this.proxies.indexOf(this.lastAmazonProxy)+1];
    }
    else {
      this.lastAmazonProxy = this.proxies[0] || undefined;
    }
    return this.lastAmazonProxy;
  },

  addTextQueue: function(data,keyword) {
    this.textQueue.data.push({data: data, keyword: keyword});
    this.textQueue.list.push(keyword);
  },

  addImageQueue: function(data,keyword) {
    this.imageQueue.data.push({data: data, keyword: keyword});
    this.imageQueue.list.push(keyword);
  },

  addBlacklistQueue: function(data,keyword) {
    this.blacklistQueue.data.push({data: data, keyword: keyword});
    this.blacklistQueue.list.push(keyword);
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

  updateBlacklistQueue: function(keyword) {
    return new Promise((resolve,reject) => {
      if (!keyword) {
        reject('Unable to update blacklist queue without keyword.');
      }
      else {
        if (this.blacklistQueue.list.includes(keyword) && this.blacklistQueue.data.length) {
          fs.writeFile(this.cachePath + '/data/blacklist/' + this.blacklistQueue.data[0].keyword + '.json', JSON.stringify(this.blacklistQueue.data[0].data), err => {
            this.blacklistQueue.list.shift();
            this.blacklistQueue.data.shift();
            this.updateBlacklistQueue(keyword).then(() => resolve()).catch(err => reject(err));
          });
        }
        else {
          resolve();
        }
      }
    });
  },

  createBlacklistCache: function(keyword) {
    return new Promise((resolve,reject) => {
      if (!keyword) {
        reject('Unable to create blacklist cache without keyword.');
      }
      else {
        if (fs.existsSync(this.cachePath + '/data/blacklist/' + keyword + '.json')) {
          resolve('Blacklist cache already exists for: ' + keyword);
        }
        else {
          let data = [];
          fs.writeFile(this.cachePath + '/data/blacklist/' + keyword + '.json', JSON.stringify(data), err => {
            if (err) reject(err);
            resolve('Blacklist cache created for: ' + keyword);
          });
        }
      }
    });
  },

  readBlacklistCache: function(keyword) {
    return new Promise((resolve,reject) => {
      if (!keyword) {
        reject('Unable to read blacklist cache without keyword.');
      }
      else {
        if (!fs.existsSync(this.cachePath + '/data/blacklist/' + keyword + '.json')) {
          reject('Blacklist cache not found for: ' + keyword);
        }
        else {
          fs.readFile(this.cachePath + '/data/blacklist/' + keyword + '.json', (err,data) => {
            if (err) reject(err);
            resolve(data);
          });
        }
      }
    });
  },

  updateBlacklistCache: function(url,keyword) {
    return new Promise((resolve,reject) => {
      if (!keyword || !url) {
        reject('Unable to update blacklist cache without keyword and url.');
      }
      else {
        this.createBlacklistCache(keyword).then(() => {
          this.readBlacklistCache(keyword).then(data => {
            data = JSON.parse(data);
            if (!data.length || !data.includes(url)) {
              data.push(url);
              this.addBlacklistQueue(data,keyword);
              this.updateBlacklistQueue(keyword).then(() => {
                resolve('Finished updating blacklist cache for: ' + keyword);
              }).catch(err => reject(err));
            }
            else {
              resolve('Item already found in blacklist cache for: ' + keyword);
            }
          }).catch(err => reject(err));
        }).catch(err => reject(err));
      }
    });
  },

  updateBlacklistCacheMultiple: function(obj,keyword,index) {
    return new Promise((resolve,reject) => {
      if (!keyword || !obj) {
        reject('Unable to update blacklist cache without keyword and object array.');
      }
      else {
        if (!index) index = 0;
        if (obj[0]) {
          this.updateBlacklistCache(obj[0],keyword).then(data => {
            if (this.debug) console.log(data);
            obj.shift();
            index++;
            this.updateBlacklistCacheMultiple(obj,keyword,index).then(data => resolve(data)).catch(err => reject(err));
          }).catch(err => {
            if (this.debug) console.log(err);
            obj.shift();
            this.updateBlacklistCacheMultiple(obj,keyword,index).then(data => resolve(data)).catch(err => reject(err));
          });
        }
        else {
          resolve(`Finished adding ${index} item(s) to blacklist cache for keyword: ${keyword}`);
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
            this.createBlacklistCache(keyword).then(() => {
              this.readBlacklistCache(keyword).then(blacklist => {
                data = JSON.parse(data);
                blacklist = JSON.parse(blacklist);
                if (blacklist.includes(obj.url)) {
                  resolve('Item already found in blacklist cache for: ' + keyword);
                }
                else if (!data.length || !this.objectPropertyInArray('url',obj,data)) {
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
          }).catch(err => reject(err));
        }).catch(err => reject(err));
      }
    });
  },

  deleteTextCache: function(keyword,property,value) {
    return new Promise((resolve,reject) => {
      if (!keyword || !property || !value) {
        reject('Unable to delete from text cache without keyword and object property and value.');
      }
      this.createTextCache(keyword).then(() => {
        this.readTextCache(keyword).then(data => {
          data = JSON.parse(data);
          let indexes = this.objectsWithPropertyAndValue(data,property,value);
          if (!indexes) {
            resolve('No objects found to delete from text cache for: ' + keyword);
          }
          else {
            let urls = [];
            for (let i = 0; i < indexes.length; i++) {
              if (data[indexes[i]].url) urls.push(data[indexes[i]].url);
              data.splice(indexes[i],1);
            }
            this.addTextQueue(data,keyword);
            this.updateTextQueue(keyword).then(() => {
              if (urls.length) {
                this.updateBlacklistCacheMultiple(urls,keyword).then(msg => {
                  if (this.debug) console.log(msg);
                  resolve(`Finished removing indexes ${indexes.join(', ')} from text cache: ${keyword}`);
                }).catch(err => reject(err));
              }
              else {
                resolve(`Finished removing indexes ${indexes.join(', ')} from text cache: ${keyword}`);
              }
            }).catch(err => reject(err));
          }
        }).catch(err => reject(err));
      }).catch(err => reject(err));
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
          }).catch(err => {
            if (this.debug) console.log(err);
            obj.shift();
            this.updateTextCacheMultiple(obj,keyword,index).then(data => resolve(data)).catch(err => reject(err));
          });
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
            this.createBlacklistCache(keyword).then(() => {
              this.readBlacklistCache(keyword).then(blacklist => {
                data = JSON.parse(data);
                blacklist = JSON.parse(blacklist);
                if (blacklist.includes(obj.url)) {
                  resolve('Item already found in blacklist cache for: ' + keyword);
                }
                else if (!data.length || !this.objectPropertyInArray('url',obj,data)) {
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
          }).catch(err => reject(err));
        }).catch(err => reject(err));
      }
    });
  },

  deleteImageCache: function(keyword,property,value) {
    return new Promise((resolve,reject) => {
      if (!keyword || !property || !value) {
        reject('Unable to delete from image cache without keyword and object property and value.');
      }
      this.createImageCache(keyword).then(() => {
        this.readImageCache(keyword).then(data => {
          data = JSON.parse(data);
          let indexes = this.objectsWithPropertyAndValue(data,property,value);
          if (!indexes) {
            resolve('No objects found to delete from image cache for: ' + keyword);
          }
          else {
            let urls = [];
            for (let i = 0; i < indexes.length; i++) {
              if (data[indexes[i]].url) urls.push(data[indexes[i]].url);
              data.splice(indexes[i],1);
            }
            this.addImageQueue(data,keyword);
            this.updateImageQueue(keyword).then(() => {
              if (urls.length) {
                this.updateBlacklistCacheMultiple(urls,keyword).then(msg => {
                  if (this.debug) console.log(msg);
                  resolve(`Finished removing indexes ${indexes.join(', ')} from image cache: ${keyword}`);
                }).catch(err => reject(err));
              }
              else {
                resolve(`Finished removing indexes ${indexes.join(', ')} from image cache: ${keyword}`);
              }
            }).catch(err => reject(err));
          }
        }).catch(err => reject(err));
      }).catch(err => reject(err));
    });
  },

  updateImageCacheMultiple: function(obj,keyword,scaleToFill,index) {
    return new Promise((resolve,reject) => {
      if (!keyword || !obj) {
        reject('Unable to update image cache without keyword and object array.');
      }
      else {
        if (scaleToFill === undefined) scaleToFill = true;
        if (!index) index = 0;
        if (obj[0]) {
          this.updateImageCache(obj[0],keyword,scaleToFill).then(data => {
            if (this.debug) console.log(data);
            obj.shift();
            index++;
            this.updateImageCacheMultiple(obj,keyword,scaleToFill,index).then(data => resolve(data)).catch(err => reject(err));
          }).catch(err => {
            if (this.debug) console.log(err);
            obj.shift();
            this.updateImageCacheMultiple(obj,keyword,scaleToFill,index).then(data => resolve(data)).catch(err => reject(err));
          });
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
    if (!fs.existsSync(this.cachePath + '/data/blacklist')) {
      if (this.debug) console.log('Blacklist data cache directory not found. Creating folder...');
      fs.mkdir(this.cachePath + '/data/blacklist',err => {
        if (err && this.debug) console.log(err);
        if (this.debug) console.log('Finished creating blacklist data cache directory.');
      });
    }
    else {
      if (this.debug) console.log('Blacklist data cache directory already exists.');
    }
  },

  objectInArray: function(obj,arr,ignoreKeys) {
    if (!obj || !arr || typeof obj !== 'object' || typeof arr !== 'object') {
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

  objectPropertyInArray: function(property,obj,arr) {
    if (!property || !obj || !arr || typeof obj !== 'object' || typeof arr !== 'object' || typeof property !== 'string' || !obj[property]) {
      return false;
    }
    for (let i = 0; i < arr.length; i++) {
      if (arr[i][property] && arr[i][property] === obj[property]) return true;
    }
    return false;
  },

  objectsWithPropertyAndValue: function(objs,property,value) {
    if (!property || !objs || !value || typeof objs !== 'object' || typeof value !== 'string' || typeof property !== 'string') {
      return false;
    }
    let indexes = [];
    for (let i = 0; i < objs.length; i++) {
      if (objs[i][property] && objs[i][property] === value) indexes.push(i);
    }
    return indexes;
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
      },this.timeout);
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

  googleImage: function(keyword,imageArgs) {
    return new Promise((resolve,reject) => {
      setTimeout(() => {
        reject('Server request timeout searching for Google image: ' + keyword);
      },this.timeout);
      if (!keyword) {
        reject('Unable to search for images without keyword.');
      }
      else {
        let imageParams = this.setImageParams(imageArgs);
        let parsedKeyword = keyword.replace(/[^a-zA-Z\s]/g,'').replace(/\s+/g,'+');
        let url = `https://www.google.${imageParams.googleDomain}/search?q=${parsedKeyword}&tbm=isch`;
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
            reject('No Google images found: ' + keyword);
          }
        }).catch(err => reject(err));
      }
    });
  },

  flickrImage: function(keyword,imageArgs) {
    return new Promise((resolve,reject) => {
      setTimeout(() => {
        reject('Server request timeout searching for Flickr image: ' + keyword);
      },this.timeout);
      if (!keyword) {
        reject('Unable to search for images without keyword.');
      }
      else {
        let imageParams = this.setImageParams(imageArgs);
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
            reject(`Unable to find Flickr images on page ${imageParams.page} for keyword: ${keyword}`);
          }
        }).catch(err => reject(err));
      }
    });
  },

  flickrImageLoop: function(keyword,imageArgs,store) {
    return new Promise((resolve,reject) => {
      if (!keyword) {
        reject('Unable to search for images without keyword.');
      }
      else {
        let imageParams = this.setImageParams(imageArgs);
        if (!store) store = [];
        this.flickrImage(keyword,imageParams).then(data => {
          store = store.concat(data);
          imageParams.page++;
          if (this.debug) console.log(`Searching for Flickr images on page ${imageParams.page} for keyword: ${keyword}`);
          this.flickrImageLoop(keyword,imageParams,store).then(data => resolve(data)).catch(err => reject(err));
        }).catch(err => {
          if (imageParams.maxTries > 1) {
            imageParams.page++;
            imageParams.maxTries--;
            if (this.debug) console.log(`Searching for Flickr images on page ${imageParams.page} for keyword: ${keyword}`);
            this.flickrImageLoop(keyword,imageParams,store).then(data => resolve(data)).catch(err => reject(err));
          }
          else if (store.length) {
            if (this.debug) console.log(err);
            if (this.debug) console.log('Resolving Flickr image loop: ' + keyword);
            resolve(store);
          }
          else {
            reject(err);
          }
        });
      }
    });
  },

  images: function(keyword,imageArgs) {
    return new Promise((resolve,reject) => {
      if (!keyword) {
        reject('Unable to search for images without keyword.');
      }
      else {
        let imageParams = this.setImageParams(imageArgs);
        if (imageParams.cacheOnly) {
          this.readImageCache(keyword).then(imgs => {
            let images = shuffle(JSON.parse(imgs));
            let filtered = [];
            for (let i = 0; i < imageParams.limit; i++) {
              if (images[i]) filtered.push(images[i]);
            }
            if (this.debug) console.log('Resolving images: ' + keyword);
            resolve(filtered);
          }).catch(error => reject(err));
        }
        else {
          if (imageParams.search === 'google') {
            this.googleImage(keyword,imageParams).then(data => {
              data = data.slice(0,imageParams.limit);
              this.updateImageCacheMultiple(data,keyword,imageParams.crop).then(msg => {
                if (this.debug) console.log(msg);
                this.readImageCache(keyword).then(imgs => {
                  let images = shuffle(JSON.parse(imgs));
                  let filtered = [];
                  for (let i = 0; i < imageParams.limit; i++) {
                    if (images[i]) filtered.push(images[i]);
                  }
                  if (this.debug) console.log('Resolving images: ' + keyword);
                  resolve(filtered);
                }).catch(err => reject(err));
              }).catch(err => reject(err));
            }).catch(err => reject(err));
          }
          else if (imageParams.search === 'flickr') {
            this.flickrImageLoop(keyword,imageParams).then(data => {
              data = data.slice(0,imageParams.limit);
              this.updateImageCacheMultiple(data,keyword,imageParams.crop).then(msg => {
                if (this.debug) console.log(msg);
                this.readImageCache(keyword).then(imgs => {
                  let images = shuffle(JSON.parse(imgs));
                  let filtered = [];
                  for (let i = 0; i < imageParams.limit; i++) {
                    if (images[i]) filtered.push(images[i]);
                  }
                  if (this.debug) console.log('Resolving images: ' + keyword);
                  resolve(filtered);
                }).catch(err => reject(err));
              }).catch(err => reject(err));
            }).catch(err => reject(err));
          }
          else {
            if (rand(true,false) === true) {
              this.googleImage(keyword,imageParams).then(data => {
                data = data.slice(0,imageParams.limit);
                this.updateImageCacheMultiple(data,keyword,imageParams.crop).then(msg => {
                  if (this.debug) console.log(msg);
                  this.readImageCache(keyword).then(imgs => {
                    let images = shuffle(JSON.parse(imgs));
                    let filtered = [];
                    for (let i = 0; i < imageParams.limit; i++) {
                      if (images[i]) filtered.push(images[i]);
                    }
                    if (this.debug) console.log('Resolving images: ' + keyword);
                    resolve(filtered);
                  }).catch(err => reject(err));
                }).catch(err => reject(err));
              }).catch(err => reject(err));
            }
            else {
              this.flickrImageLoop(keyword,imageParams).then(data => {
                data = data.slice(0,imageParams.limit);
                this.updateImageCacheMultiple(data,keyword,imageParams.crop).then(msg => {
                  if (this.debug) console.log(msg);
                  this.readImageCache(keyword).then(imgs => {
                    let images = shuffle(JSON.parse(imgs));
                    let filtered = [];
                    for (let i = 0; i < imageParams.limit; i++) {
                      if (images[i]) filtered.push(images[i]);
                    }
                    if (this.debug) console.log('Resolving images: ' + keyword);
                    resolve(filtered);
                  }).catch(err => reject(err));
                }).catch(err => reject(err));
              }).catch(err => reject(err));
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

  validateParagraph: function(paragraph) {
    if (!paragraph || typeof paragraph !== 'string') {
      return false;
    }
    if (paragraph.match(/\b(we|our|us|ourselves|ourself|i|my|me|myself)\b/i)) return false;
    if (paragraph.match(/\b(today|tomorrow|yesterday|last\sweek|last\smonth|last\syear|next\sweek|next\smonth|next\syear|this\sweek|this\smonth|this\syear)\b/i)) return false;
    if (paragraph.match(/\b(please|thanks|thankyou|thank\syou|hello|hi|hey|greetings|welcome|goodbye|bye)\b/i)) return false;
    if (paragraph.match(/\b(shit|fuck|dick|piss|cunt|bitch|bastard)\b/i)) return false;
    return true;
  },

  validateHeader: function(sentence,url) {
    if (!sentence || !url || typeof sentence !== 'string' || typeof url !== 'string') {
      return false;
    }
    if (sentence.match(/[a-z][A-Z]/)) return false;
    if (sentence.match(/[^a-zA-Z\s\,\/\-0-9]/)) return false;
    if (!sentence.match(/^[A-Z]/)) return false;
    if (this.matchUrl(sentence,url)) return false;
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
    if (sentence.match(/\b(the|these|this)\s+(below|following)\b/i)) return false;
    if (this.matchUrl(sentence,url)) return false;
    return true;
  },

  findKeywordInSentence: function(keyword,sentence,exact,minCount) {
    if (!keyword || typeof keyword !== 'string' || !sentence || typeof sentence !== 'string') {
      return false;
    }
    if (exact === undefined) exact = true;
    if (!minCount) minCount = 0;
    let lowercasedKeyword = keyword.replace(/[^\w]/gi,' ').replace(/\s+/g,' ').toLowerCase();
    let lowercasedSentence = sentence.toLowerCase();
    if (lowercasedSentence.includes(lowercasedKeyword)) return true;
    if (lowercasedKeyword.match(/^\s|\s$/)) return false;
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
    let lowercasedHeader = header.replace(/[^\w]/gi,' ').replace(/\s+/g,' ').trim().toLowerCase();
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
      if (text.toLowerCase().includes(keywordList[i].toLowerCase())) return true;
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
      if (link.url.match(regex)) return true;
      return false;
      case 'facts':
      regex = /\b(facts|info|information)\b/i;
      if (link.url.match(regex)) return true;
      case 'myths':
      regex = /\b(myths|misconceptions)\b/i;
      if (link.url.match(regex)) return true;
      case 'list':
      regex = /\b(list|best|top|\d\s\w|\d-\w)\b/i;
      if (link.url.match(regex)) return true;
      return false;
      case 'product':
      regex = /\b(\d\d)\b/i;
      if (link.url.match(regex)) return true;
      return false;
      case 'review':
      regex = /\b(review)\b/i;
      if (link.url.match(regex)) return true;
      return false;
      default: return false;
    }
  },

  filterBodyContent: function(paragraph,url) {
    if (!paragraph || !url || typeof paragraph !== 'string' || typeof url !== 'string') {
      return [];
    }
    let splitParagraph = paragraph.split('|||||');
    if (!this.validateParagraph(splitParagraph.join(' '))) return [];
    let filtered = [];
    for (let i = 0; i < splitParagraph.length; i++) {
      if (this.validateText(splitParagraph[i],url)) filtered.push(splitParagraph[i]);
    }
    if (filtered.length) return filtered;
    return [];
  },

  filterProductBodyContent: function(paragraph,url) {
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
    return new Promise((resolve,reject) => {
      setTimeout(() => {
        reject('Server request timeout out parsing webpage: ' + url);
      },this.timeout);
      let title = this.parseHeader($('h1').first().text().trim() || $('h2').first().text().trim() || '');
      let objs = [];
      let self = this;
      $('div').contents().each(function(i,el) {
        if (el.name === 'h1' || el.name === 'h2' || el.name === 'h3' || el.name === 'h4' || el.name === 'h5' || el.name === 'h6' || el.name === 'strong' || el.name === 'b') {
          objs.push({type: 'header', content: self.parseHeader($(this).text().trim())});
        }
        else if (el.name === 'p' || el.type === 'text') {
          if (el.firstChild && (el.firstChild.name === 'strong' || el.firstChild.name === 'em' || el.firstChild.name === 'b' || el.firstChild.name === 'i')) {
            if (el.firstChild.children && el.firstChild.children.length === 1 && el.firstChild.children[0].type === 'text') {
              objs.push({type: 'header', content: self.parseHeader(el.firstChild.children[0].data)});
              let text = $(this).text().replace(el.firstChild.children[0].data,'').trim();
              objs.push({type: 'text', content: self.parseText(text)});
            }
          }
          else if (!el.firstChild || (el.firstChild && el.firstChild.type && el.firstChild.type === 'text')) {
            objs.push({type: 'text', content: self.parseText($(this).text().trim())});
          }
        }
        else if (el.name === 'ul' || el.type === 'ol') {
          let list = [];
          for (let i = 0; i < el.children.length; i++) {
            if (el.children[i].name === 'li') {
              for (let j = 0; j < el.children[i].children.length; j++) {
                if (j === 0 && el.children[i].children[j].type === 'text') {
                  let text = el.children[i].children[j].data.trim();
                  if (text) list.push(text);
                }
              }
            }
          }
          if (list.length) objs.push({type: 'text', content: self.parseText(list.join(' '))});
        }
      });
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
      resolve({content: filteredObjs, title: title});
    });
  },

  webpage: function(url,filterText) {
    return new Promise((resolve,reject) => {
      setTimeout(() => {
        reject('Server request timeout out at: ' + url);
      },this.timeout);
      let options = {
        method: 'GET',
        uri: url,
        gzip: true,
        rejectUnauthorized: false,
        headers: {'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:20.0) Gecko/20100101 Firefox/20.0'}
      };
      if (this.debug) console.log('Requesting webpage: ' + url);
      request(options).then(html => {
        if (this.debug) console.log('Parsing webpage: ' + url);
        let $ = cheerio.load(html);
        this.extractBodyContent($,url,filterText).then(data => {
          let pageObject = {
            title: $('title').text() || '',
            description: $('meta[name="description"]').attr('content') || '',
            keywords: $('meta[name="keywords"]').attr('content') || '',
            url: url,
            body: data
          };
          if (pageObject.body) {
            if (this.debug) console.log('Resolving webpage: ' + url);
            resolve(pageObject);
          }
          else {
            reject('No webpage content found: ' + url);
          }
        }).catch(err => reject(err));
      }).catch(err => reject(err));
    });
  },

  firstParagraph: function(obj,textKeywords) {
    if (!obj || !obj.body.content.length) {
      return null;
    }
    let data = obj.body.content;
    let paragraph;
    for (let i = 0; i < data.length; i++) {
      if (i > 0) break;
      if (data[i].text.length > 1 && ((!textKeywords && data[i].text.join(' ').match(/\./)) || (textKeywords && this.textFromKeywordList(data[i].text.join(' '),textKeywords)))) {
        return {text: data[i].text, header: data[i].header, keyword: false, url: obj.url};
      }
    }
    return null;
  },

  filteredParagraph: function(obj,textKeywords) {
    if (!obj || !obj.body.content.length) {
      return [];
    }
    let data = obj.body.content;
    let paragraph = [];
    for (let i = 0; i < data.length; i++) {
      if (data[i].text.length > 1 && textKeywords && this.textFromKeywordList(data[i].text.join(' '),textKeywords)) {
        paragraph.push({text: data[i].text, header: data[i].header, keyword: false, url: obj.url});
      }
      else if (data[i].text.length > 1 && !textKeywords) {
        paragraph.push({text: data[i].text, header: data[i].header, keyword: false, url: obj.url});
      }
    }
    return paragraph;
  },

  randomParagraph: function(obj,count,headerKeywords,textKeywords) {
    if (!obj || !obj.body.content.length) {
      return [];
    }
    if (!count) count = 1;
    if (!headerKeywords) headerKeywords = null;
    if (!textKeywords) textKeywords = [];
    let paragraphs = [];
    let data = obj.body.content;
    let firstHeader = this.firstParagraph(obj) ? this.firstParagraph(obj).header : '';
    data = shuffle(data);
    for (let i = 0; i < data.length; i++) {
      if (paragraphs.length < count) {
        if (data[i].header !== firstHeader) {
          if (headerKeywords && textKeywords.length) {
            let headerMatch = this.headerFromKeywordList(data[i].header,headerKeywords);
            let textMatch = this.textFromKeywordList(data[i].text.join(' '),textKeywords);
            if (!textMatch) continue;
            let paragraph = {
              text: data[i].text,
              header: headerMatch ? pos.titlecase(headerMatch) : data[i].header,
              keyword: headerMatch ? true : false,
              url: obj.url
            };
            if (data[i].text.length > 1) paragraphs.push(paragraph);
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
            if (data[i].text.length > 1) paragraphs.push(paragraph);
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
            if (data[i].text.length > 1) paragraphs.push(paragraph);
          }
          else {
            if (data[i].text.length > 1) paragraphs.push({text: data[i].text, header: data[i].header, keyword: false, url: obj.url});
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

  pageParagraphs: function(obj,headerKeywords,count) {
    return obj.body.content;
  },

  resultLinks: function($,searchSource) {
    let links = [];
    if (searchSource === 'google') {
      $('h3 a').each(function(i,el) {
        if ($(this).attr('href').match(/(http:|https:)/g)) {
          let url = $(this).attr('href');
          let text = $(this).text();
          links.push({url: url, text: text});
        }
      });
    }
    else if (searchSource === 'bing') {
      $('h2 a').each(function(i,el) {
        if ($(this).attr('href').match(/(http:|https:)/g) && !$(this).attr('href').match(/(bing\.|microsoft\.)/g)) {
          let url = $(this).attr('href');
          let text = $(this).text();
          links.push({url: url, text: text});
        }
      });
    }
    return links;
  },

  amazonResultLinks: function($,keyword) {
    let links = [];
    $('.a-link-normal.s-access-detail-page.s-color-twister-title-link.a-text-normal').each(function(i,el) {
      if ($(this).attr('href').match(/(http:|https:)/g)) {
        let url = $(this).attr('href');
        let text = $(this).text();
        links.push({url: url, text: text, keyword: keyword});
      }
    });
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

  amazonSearch: function(keyword,minResult,maxResult) {
    return new Promise((resolve,reject) => {
      setTimeout(() => {
        reject('Server request timeout searching for Amazon page: ' + keyword);
      },this.timeout);
      if (!keyword) {
        reject('Unable to search for Amazon page without keyword.');
      }
      else {
        if (!minResult) minResult = 1;
        if (!maxResult) maxResult = minResult;
        let parsedKeyword = keyword.replace(/\s/g,'+');
        let queryPage = Math.floor(Math.random() * maxResult) + minResult;
        let url = `https://www.amazon.com/s/field-keywords=${parsedKeyword}&page=${queryPage}`;
        let options = {
          method: 'GET',
          uri: url,
          gzip: true,
          headers: {'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:20.0) Gecko/20100101 Firefox/20.0'}
        };
        let proxy = this.amazonProxy();
        if (proxy) {
          options.proxy = proxy;
        }
        else {
          if (this.debug) console.log('WARNING: Proxies currently not set.');
        }
        request(options).then(html => {
          if (this.debug) console.log('Searching Amazon for keyword: ' + keyword + ' - ' + minResult);
          let $ = cheerio.load(html);
          let results = this.amazonResultLinks($,keyword);
          if (this.debug) console.log('Resolving Amazon search: ' + keyword);
          resolve(results);
        }).catch(err => reject(err));
      }
    });
  },

  parseAmazonProduct: function($,url) {
    let obj = {};
    obj.url = url;
    obj.title = $('span#productTitle.a-size-large').text().trim();
    if (!obj.title) return null;
    obj.brand = $('#brand').text().trim();
    obj.price = $('#priceblock_ourprice').text().trim();
    obj.colors = $('#variation_color_name li').map(function(i,el) {
      return $(this).attr('title').replace(/Click\sto\sselect\s/,'');
    }).get();
    obj.sizes = $('#variation_size_name li').map(function(i,el) {
      return $(this).attr('title').replace(/Click\sto\sselect\s/,'');
    }).get();
    obj.features = $('#feature-bullets li').map(function(i,el) {
      return $(this).text().trim();
    }).get();
    $('#detailBullets_feature_div li').each(function(i,el) {
      let text = $(this).text().replace(/\n/g,'').replace(/\s+/g,' ').trim();
      if (text.match(/product\s+dimensions:\s+/gi)) {
        obj.dimensions = text.replace(/product\s+dimensions:\s+/gi,'');
      }
      else if (text.match(/shipping\s+weight:\s+/gi)) {
        obj.weight = text.replace(/shipping\s+weight:\s+/gi,'').replace(/\s+\(.+/gi,'');
      }
      else if (text.match(/asin:\s+/gi)) {
        obj.asin = text.replace(/asin:\s+/gi,'');
      }
    });
    obj.description = [];
    let self = this;
    $('#productDescription p').each(function(i,el) {
      if ($(this).contents().length) {
        $(this).contents().each(function(i,sub) {
          let text = self.parseText($(this).text());
          let filtered = self.filterBodyContent(text,url);
          if (filtered.length) obj.description = obj.description.concat(filtered);
        });
      }
      else {
        let text = self.parseText($(this).text());
        let filtered = self.filterBodyContent(text,url);
        if (filtered.length) obj.description = obj.description.concat(filtered);
      }
    });
    obj.reviews = $('div [data-hook="review-collapsed"]').map(function(i,el) {
      return $(this).text();
    }).get();
    obj.rating = $('#reviewSummary .a-icon-alt').text();
    let imageData;
    obj.images = [];
    $('script').each(function(i,el) {
      let text = $(this).html();
      if (text.match(/\'colorImages\'/)) {
        imageData = text;
        imageData = imageData.replace(/(\{|\})/g,'$1|||||').split('|||||');
        for (let i = 0; i < imageData.length; i++) {
          let imageSizes = imageData[i].split(',');
          for (let j = 0; j < imageSizes.length; j++) {
            if (imageSizes[j].match(/"hiRes"/)) {
              let img = imageSizes[j].replace(/"hiRes":"(.+)"/,'$1');
              let imgObject = {
                image: img,
                url: img,
                title: obj.title,
                author: obj.brand,
                width: 0,
                height: 0,
                description: obj.description,
                filename: path.basename(img.split('?')[0]),
                search: [],
                tags: [],
                copyright: true
              };
              obj.images.push(imgObject);
              break;
            }
            else if (imageSizes[j].match(/"large"/)) {
              let img = imageSizes[j].replace(/"large":"(.+)"/,'$1');
              let imgObject = {
                image: img,
                url: img,
                title: obj.title,
                author: obj.brand,
                width: 0,
                height: 0,
                description: obj.description,
                filename: path.basename(img.split('?')[0]),
                search: [],
                tags: [],
                copyright: true
              };
              obj.images.push(imgObject);
              break;
            }
          }

        }
      }
    });
    return obj;
  },

  amazonProduct: function(link) {
    return new Promise((resolve,reject) => {
      setTimeout(() => {
        reject('Server request timeout loading Amazon page: ' + link.url);
      },this.timeout);
      if (!link || !link.text || !link.url || !link.keyword) {
        reject('Unable to download Amazon page without link object.');
      }
      else {
        let options = {
          method: 'GET',
          uri: link.url,
          gzip: true,
          headers: {'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:20.0) Gecko/20100101 Firefox/20.0'}
        };
        let proxy = this.amazonProxy();
        if (proxy) {
          options.proxy = proxy;
        }
        else {
          if (this.debug) console.log('WARNING: Proxies currently not set.');
        }
        this.readTextCache(link.keyword).then(text => {
          text = JSON.parse(text);
          if (this.objectPropertyInArray('url',link,text)) {
            reject('Amazon product already exists in cache: ' + link.text);
          }
          else {
            request(options).then(html => {
              if (this.debug) console.log('Loading Amazon product page: ' + link.text);
              let $ = cheerio.load(html);
              let obj = this.parseAmazonProduct($,link.url);
              resolve(obj);
            }).catch(err => reject(err));
          }
        }).catch(err => {
          if (this.debug) console.log(err);
          request(options).then(html => {
            if (this.debug) console.log('Loading Amazon product page: ' + link.text);
            let $ = cheerio.load(html);
            let obj = this.parseAmazonProduct($,link.url);
            resolve(obj);
          }).catch(err => reject(err));
        });
      }
    });
  },

  imageCredit: function(image) {
    if (!image) {
      return '';
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

  videoProperties: function(obj,searchArgs,imageArgs,fallbackImages,keywordStore,firstSlide) {
    return new Promise((resolve,reject) => {
      if (!obj || !searchArgs || !searchArgs.keyword || !imageArgs || !imageArgs.fallback || !fallbackImages.length) {
        reject('Unable to create video properties without page object and fallback image data.');
      }
      else {
        let searchParams = this.setSearchParams(searchArgs);
        let imageParams = this.setImageParams(imageArgs);
        if (!keywordStore) keywordStore = [];
        let slides = [];
        let credits = [];
        let useFallback = obj.keyword ? false : true;
        let keyword = useFallback ? imageParams.fallback : obj.header.toLowerCase();
        let titleFallback = pos.titlecase(searchParams.keyword);
        if (!obj.keyword) {
          let headerMatch = this.headerFromKeywordList(imageParams.fallback,searchParams.headerKeywords);
          if (headerMatch) {
            keyword = headerMatch.toLowerCase();
            obj.keyword = true;
            if (!keywordStore.includes(keyword)) keywordStore.push(keyword);
          }
        }
        else {
          if (!keywordStore.includes(keyword)) keywordStore.push(keyword);
        }
        if (useFallback) imageParams.cacheOnly = true;
        this.images(keyword,imageParams).then(data => {
          let imageActive = true;
          let textActive = true;
          if (imageParams.template.includes('imageOnly') || imageParams.template.includes('imageAudio')) textActive = false;
          if (imageParams.template.includes('textOnly')) imageActive = false;
          let bothActive = imageActive && textActive ? true : false;
          if (obj.keyword || firstSlide) {
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
              titleText = !firstSlide ? obj.header : titleFallback;
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
              titleText = !firstSlide ? obj.header : titleFallback;
            }
            let titleObj = {
              text: titleText,
              audio: '',
              image: titleImage,
              template: imageParams.template,
              keyword: keyword,
              url: obj.url
            };
            if (titleObj.text) {
              let titleCredit = this.imageCredit(titleObj.image);
              if (titleCredit && !titleObj.image.copyright) credits.push(titleCredit);
              slides.push(titleObj);
            }
          }
          for (let i = 0; i < obj.text.length; i++) {
            if (!obj.text[i]) continue;
            let slideText, slideImage;
            let snippet = pos.snippet(obj.text[i]);
            if (bothActive) {
              if (useFallback) {
                slideImage = fallbackImages[0] ? rand(fallbackImages[0],null) : null;
                if (slideImage) fallbackImages.shift();
              }
              else {
                slideImage = data[0] ? rand(data[0],null) : null;
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
              audio: (textActive || imageParams.template.includes('imageAudio')) ? obj.text[i] : '',
              image: slideImage,
              template: imageParams.template,
              keyword: keyword,
              url: obj.url
            };
            if (slideObj.text || slideObj.image) {
              let slideCredit = this.imageCredit(slideObj.image);
              if (slideCredit && !slideObj.image.copyright) credits.push(slideCredit);
              slides.push(slideObj);
            }
          }
          if (slides.length) {
            if (this.debug) console.log('Resolving video properties: ' + keyword);
            resolve({slides: slides, credits: credits});
          }
          else {
            reject('No video properties found from: ' + obj.url);
          }
        }).catch(err => {
          reject(err);
        });
      }
    });
  },

  videoPropertiesMultiple: function(objs,searchArgs,imageArgs,fallbackImages,keywordStore,slideStore,index) {
    return new Promise((resolve,reject) => {
      if (!objs || !objs[0] || !searchArgs.keyword || !imageArgs || !imageArgs.fallback || (!fallbackImages.length && !index)) {
        reject('Unable to create multiple video properties without page object array and fallback image data.');
      }
      else {
        let searchParams = this.setSearchParams(searchArgs);
        let imageParams = this.setImageParams(imageArgs);
        if (!keywordStore) keywordStore = [];
        if (!slideStore) slideStore = {
          slides: [],
          credits: []
        };
        if (!index) index = 0;
        let firstSlide = false;
        if (!slideStore.slides.length) firstSlide = true;
        if (index < objs.length && fallbackImages.length) {
          this.videoProperties(objs[index],searchParams,imageParams,fallbackImages,keywordStore,firstSlide).then(data => {
            slideStore.slides = slideStore.slides.concat(data.slides);
            slideStore.credits = slideStore.credits.concat(data.credits);
            index++;
            if (index >= objs.length) {
              if (this.debug) console.log('Resolving multiple video properties: ' + searchParams.url);
              resolve(slideStore);
            }
            else {
              this.videoPropertiesMultiple(objs,searchParams,imageParams,fallbackImages,keywordStore,slideStore,index).then(data => resolve(data)).catch(err => reject(err));
            }
          }).catch(err => {
            if (this.debug) console.log(err);
            index++;
            if (index >= objs.length) {
              if (this.debug) console.log('Resolving multiple video properties: ' + searchParams.url);
              resolve(slideStore);
            }
            else {
              this.videoPropertiesMultiple(objs,searchParams,imageParams,fallbackImages,keywordStore,slideStore,index).then(data => resolve(data)).catch(err => reject(err));
            }
          });
        }
        else if (slideStore.slides.length) {
          if (this.debug) console.log('Resolving multiple video properties: ' + searchParams.url);
          resolve(slideStore);
        }
        else {
          reject('No video properties found from: ' + searchParams.url);
        }
      }
    });
  },

  setImageParams: function(imageArgs) {
    if (!imageArgs) imageArgs = {};
    let imageParams = Object.assign({},imageArgs);
    if (!imageParams.fallback) imageParams.fallback = '';
    if (!imageParams.template) imageParams.template = '';
    if (!imageParams.search) imageParams.search = 'google';
    if (!imageParams.options) imageParams.options = ['medium','commercial'];
    if (!imageParams.tags) imageParams.tags = [];
    if (imageParams.crop === undefined) imageParams.crop = true;
    if (imageParams.cacheOnly === undefined) imageParams.cacheOnly = true;
    if (imageParams.exact === undefined) imageParams.exact = true;
    if (!imageParams.limit) imageParams.limit = 1;
    if (!imageParams.fallbackLimit) imageParams.fallbackLimit = 20;
    if (!imageParams.page) imageParams.page = 1;
    if (!imageParams.maxTries) imageParams.maxTries = 5;
    if (!imageParams.googleDomain) imageParams.googleDomain = 'com.au';
    return imageParams;
  },

  setSearchParams: function(searchArgs) {
    if (!searchArgs) searchArgs = {};
    let searchParams = Object.assign({},searchArgs);
    if (!searchParams.minResult) searchParams.minResult = 1;
    if (!searchParams.maxResult) searchParams.maxResult = 1;
    if (searchParams.maxResult < searchParams.minResult) searchParams.maxResult = searchParams.minResult;
    if (!searchParams.minSections) searchParams.minSections = 15;
    if (!searchParams.maxSections) searchParams.maxSections = 20;
    if (!searchParams.maxTries) searchParams.maxTries = 10;
    if (!searchParams.template) searchParams.template = 'facts';
    if (!searchParams.count) searchParams.count = 1;
    if (!searchParams.category) searchParams.category = 0;
    if (!searchParams.privacy) searchParams.privacy = 'Public';
    if (searchParams.exact === undefined) searchParams.exact = true;
    if (searchParams.subSections === undefined) searchParams.subSections = true;
    if (searchParams.matchSections === undefined) searchParams.matchSections = true;
    if (!searchParams.headerKeywords) searchParams.headerKeywords = null;
    if (!searchParams.textKeywords) searchParams.textKeywords = [];
    if (!searchParams.keywordType) searchParams.keywordType = 'PLURAL';
    if (searchParams.keywordPlural === undefined) searchParams.keywordPlural = true;
    if (!searchParams.keywordDeterminer) searchParams.keywordDeterminer = '';
    if (!searchParams.keywordNoun) searchParams.keywordNoun = '';
    if (!searchParams.keywordList) searchParams.keywordList = [];
    if (!searchParams.link) searchParams.link = '';
    return searchParams;
  },

  video: function(keyword,searchArgs,imageArgs,dataStore) {
    return new Promise((resolve,reject) => {
      if (!keyword) {
        reject('Unable to create video without keyword.');
      }
      else {
        let searchParams = this.setSearchParams(searchArgs);
        let imageParams = this.setImageParams(imageArgs);
        searchParams.keyword = keyword;
        if (dataStore && dataStore[0]) {
          let text = obj.body.content;
          searchParams.url = obj.url;
          if (text && text.length) {
            let fallbackImageParams = this.setImageParams(imageParams);
            fallbackImageParams.limit = imageParams.fallbackLimit;
            this.images(imageParams.fallback,fallbackImageParams).then(fallbackImages => {
              this.videoPropertiesMultiple(text,searchParams,imageParams,fallbackImages).then(data => {
                let slides = {
                  title: pos.title(keyword,searchParams.keywordType,searchParams.template,data.count),
                  category: searchParams.category,
                  privacy: searchParams.privacy,
                  clips: data.slides,
                  tags: pos.tags(searchParams.keywordList)
                };
                let intro = pos.intro(searchParams.template,searchParams.keywordList,searchParams.keywordPlural,searchParams.keywordDeterminer,searchParams.keywordNoun);
                let promo = pos.promo(searchParams.keyword,searchParams.link,searchParams.keywordDeterminer);
                let license = pos.license(!data.credits.length);
                let description = [];
                if (promo) description.push(promo);
                if (intro) description.push(intro);
                if (license) description.push(license);
                if (data.credits.length) {
                  description.push('IMAGE CREDITS');
                  description.push(data.credits.join('\n'));
                }
                slides.description = description.join('\n\n');
                if (this.debug) console.log('Resolving slides for video: ' + slides.title);
                resolve(slides);
              }).catch(err => reject(err));
            }).catch(err => reject(err));
          }
          else {
            reject('No text object found for video keyword: ' + keyword);
          }
        }
        else {
          this.readTextCache(keyword).then(data => {
            data = JSON.parse(data);
            if (data.length) data = shuffle(data);
            let obj = data.length ? rand(...data) : null;
            let text = obj.body.content;
            searchParams.url = obj.url;
            if (text && text.length) {
              let fallbackImageParams = this.setImageParams(imageParams);
              fallbackImageParams.limit = imageParams.fallbackLimit;
              this.images(imageParams.fallback,fallbackImageParams).then(fallbackImages => {
                this.videoPropertiesMultiple(text,searchParams,imageParams,fallbackImages).then(data => {
                  let titleKeyword = searchParams.keywordList.length ? rand(...searchParams.keywordList) : keyword;
                  let promoKeyword = searchParams.keywordList.length ? rand(...searchParams.keywordList) : keyword;
                  let slides = {
                    title: pos.title(titleKeyword,searchParams.keywordType,searchParams.template,data.count),
                    category: searchParams.category,
                    privacy: searchParams.privacy,
                    clips: data.slides,
                    tags: pos.tags(searchParams.keywordList)
                  };
                  let intro = pos.intro(searchParams.template,searchParams.keywordList,searchParams.keywordPlural,searchParams.keywordDeterminer,searchParams.keywordNoun);
                  let promo = pos.promo(promoKeyword,searchParams.link,searchParams.keywordDeterminer);
                  let license = pos.license(!data.credits.length);
                  let description = [];
                  if (promo) description.push(promo);
                  if (intro) description.push(intro);
                  if (license) description.push(license);
                  if (data.credits.length) {
                    description.push('IMAGE CREDITS');
                    description.push(data.credits.join('\n'));
                  }
                  slides.description = description.join('\n\n');
                  if (this.debug) console.log('Resolving slides for video: ' + slides.title);
                  resolve(slides);
                }).catch(err => reject(err));
              }).catch(err => reject(err));
            }
            else {
              reject('No text object found for video keyword: ' + keyword);
            }
          }).catch(err => reject(err));
        }
      }
    });
  },

  downloadResults: function(results,store) {
    return new Promise((resolve,reject) => {
      if (!results) {
        reject('Unable to download pages without search results.');
      }
      else {
        if (!store) store = [];
        if (results[0]) {
          this.webpage(results[0].url).then(page => {
            if (page.body.content.length > 5) {
              store.push(page);
            }
            results.shift();
            if (results.length) {
              this.downloadResults(results,store).then(data => resolve(data)).catch(err => reject(err));
            }
            else if (store.length) {
              if (this.debug) console.log(`Resolving ${store.length} downloaded page results.`);
              resolve(store);
            }
            else {
              reject('No page results found to download.');
            }
          }).catch(err => {
            if (this.debug) console.log(err);
            results.shift();
            if (results.length) {
              this.downloadResults(results,store).then(data => resolve(data)).catch(err => reject(err));
            }
            else if (store.length) {
              if (this.debug) console.log(`Resolving ${store.length} downloaded page results.`);
              resolve(store);
            }
            else {
              reject('No page results found to download.');
            }
          });
        }
        else if (store.length) {
          if (this.debug) console.log(`Resolving ${store.length} downloaded page results.`);
          resolve(store);
        }
        else {
          reject('No page results found to download.');
        }
      }
    });
  },

  pages: function(keyword,searchArgs,limit,pages) {
    return new Promise((resolve,reject) => {
      if (!keyword) {
        reject('Unable to search for pages without keyword.');
      }
      else {
        let searchParams = this.setSearchParams(searchArgs);
        if (!limit) limit = 1;
        if (!pages) pages = 0;
        if (limit > 0) {
          this.search(keyword,searchParams.minResult,searchParams.maxResult).then(results => {
            this.downloadResults(results).then(text => {
              let textCount = text.length;
              this.updateTextCacheMultiple(text,keyword).then(data => {
                searchArgs.minResult += 10;
                pages += textCount;
                limit--;
                if (limit > 0) {
                  this.pages(keyword,searchArgs,limit,pages).then(data => resolve(data)).catch(err => reject(err));
                }
                else {
                  if (pages) {
                    resolve(`Resolving ${pages} pages for keyword: ${keyword}`);
                  }
                  else {
                    reject(`No pages found for keyword: ${keyword}`);
                  }
                }
              }).catch(err => reject(err));
            }).catch(err => {
              searchArgs.minResult += 10;
              limit--;
              if (limit > 0) {
                this.pages(keyword,searchArgs,limit,pages).then(data => resolve(data)).catch(err => reject(err));
              }
              else {
                if (pages) {
                  if (this.debug) console.log(err);
                  resolve(`Resolving ${pages} pages for keyword: ${keyword}`);
                }
                else {
                  reject(err);
                }
              }
            });
          }).catch(err => reject(err));
        }
      }
    });
  }

};

const request = require('request-promise');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const jimp = require('jimp');
const rand = require('bmjs-random');
const pos = require('bmjs-engpos');
const shuffle = require('bmjs-shuffle');
const fcp = require('bmjs-fcpxml');

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

  setImageParams: function(imageArgs) {
    if (!imageArgs) imageArgs = {};
    let imageParams = Object.assign({},imageArgs);
    if (!imageParams.fallback) imageParams.fallback = '';
    if (!imageParams.template) imageParams.template = '';
    if (!imageParams.search) imageParams.search = 'google';
    if (!imageParams.options) imageParams.options = ['medium','commercial'];
    if (!imageParams.tags) imageParams.tags = [];
    if (imageParams.crop === undefined) imageParams.crop = true;
    if (imageParams.cacheOnly === undefined) imageParams.cacheOnly = false;
    if (imageParams.cacheKeyword === undefined) imageParams.cacheKeyword = false;
    if (imageParams.cacheFallback === undefined) imageParams.cacheFallback = false;
    if (imageParams.exact === undefined) imageParams.exact = true;
    if (!imageParams.limit) imageParams.limit = 1;
    if (!imageParams.count) imageParams.count = 1;
    if (!imageParams.fallbackLimit) imageParams.fallbackLimit = 20;
    if (!imageParams.page) imageParams.page = 1;
    if (!imageParams.maxTries) imageParams.maxTries = 5;
    if (!imageParams.googleDomain) imageParams.googleDomain = 'com.au';
    if (!imageParams.tagline) imageParams.tagline = '';
    if (!imageParams.logo) imageParams.logo = '';
    if (imageParams.random === undefined) imageParams.random = true;
    return imageParams;
  },

  setSearchParams: function(searchArgs) {
    if (!searchArgs) searchArgs = {};
    let searchParams = Object.assign({},searchArgs);
    if (!searchParams.minResult) searchParams.minResult = 1;
    if (!searchParams.maxResult) searchParams.maxResult = 1;
    if (searchParams.maxResult < searchParams.minResult) searchParams.maxResult = searchParams.minResult;
    if (searchParams.intro === undefined) searchParams.intro = 10;
    if (searchParams.sections === undefined) searchParams.sections = 5;
    if (!searchParams.count) searchParams.count = 10;
    if (!searchParams.maxTries) searchParams.maxTries = 10;
    if (!searchParams.template) searchParams.template = 'facts';
    if (!searchParams.limit) searchParams.limit = 1;
    if (!searchParams.category) searchParams.category = '22';
    if (!searchParams.privacy) searchParams.privacy = 'public';
    if (searchParams.exact === undefined) searchParams.exact = true;
    if (!searchParams.keywordType) searchParams.keywordType = 'PLURAL';
    if (searchParams.keywordPlural === undefined) searchParams.keywordPlural = true;
    if (!searchParams.keywordDeterminer) searchParams.keywordDeterminer = '';
    if (!searchParams.keywordNoun) searchParams.keywordNoun = '';
    if (!searchParams.keywordList) searchParams.keywordList = [];
    if (!searchParams.link) searchParams.link = '';
    if (searchParams.amazon === undefined) searchParams.amazon = false;
    if (searchParams.cacheOnly === undefined) searchParams.cacheOnly = false;
    if (searchParams.multipleOnly === undefined) searchParams.multipleOnly = false;
    if (!searchParams.assets) searchParams.assets = __dirname + '/assets/';
    if (!searchParams.images) searchParams.images = __dirname + '/cache/images/';
    if (!searchParams.voice) searchParams.voice = 'karen';
    if (!searchParams.project) searchParams.project = 'My Project';
    if (!searchParams.clips) searchParams.clips = 'clips-metadata.json';
    if (!searchParams.stills) searchParams.stills = 'stills';
    if (!searchParams.slideshows) searchParams.slideshows = 1;
    if (!searchParams.keyword) searchParams.keyword = '';
    if (searchParams.random === undefined) searchParams.random = true;
    if (!searchParams.minLength) searchParams.minLength = 0;
    if (!searchParams.matchRegex) searchParams.matchRegex = null;
    if (searchParams.strict === undefined) searchParams.strict = false;
    if (searchParams.shuffle === undefined) searchParams.shuffle = false;
    if (!searchParams.imageKeywords) searchParams.imageKeywords = [];
    return searchParams;
  },

  overrideImageParams: function(imageArgs,overrideArgs) {
    let imageParams = this.setImageParams(imageArgs);
    if (overrideArgs && typeof overrideArgs === 'object') {
      if (overrideArgs.fallback) imageParams.fallback = overrideArgs.fallback;
      if (overrideArgs.template) imageParams.template = overrideArgs.template;
      if (overrideArgs.search) imageParams.search = overrideArgs.search;
      if (overrideArgs.options) imageParams.options = overrideArgs.options;
      if (overrideArgs.tags) imageParams.tags = overrideArgs.tags;
      if (overrideArgs.crop !== undefined) imageParams.crop = overrideArgs.crop;
      if (overrideArgs.cacheOnly !== undefined) imageParams.cacheOnly = overrideArgs.cacheOnly;
      if (overrideArgs.cacheKeyword !== undefined) imageParams.cacheKeyword = overrideArgs.cacheKeyword;
      if (overrideArgs.cacheFallback !== undefined) imageParams.cacheFallback = overrideArgs.cacheFallback;
      if (overrideArgs.exact !== undefined) imageParams.exact = overrideArgs.exact;
      if (overrideArgs.limit) imageParams.limit = overrideArgs.limit;
      if (overrideArgs.count) imageParams.count = overrideArgs.count;
      if (overrideArgs.fallbackLimit) imageParams.fallbackLimit = overrideArgs.fallbackLimit;
      if (overrideArgs.page) imageParams.page = overrideArgs.page;
      if (overrideArgs.maxTries) imageParams.maxTries = overrideArgs.maxTries;
      if (overrideArgs.googleDomain) imageParams.googleDomain = overrideArgs.googleDomain;
      if (overrideArgs.tagline) imageParams.tagline = overrideArgs.tagline;
      if (overrideArgs.logo) imageParams.logo = overrideArgs.logo;
      if (overrideArgs.random !== undefined) imageParams.random = overrideArgs.random;
    }
    return imageParams;
  },

  overrideSearchParams: function(searchArgs,overrideArgs) {
    let searchParams = this.setSearchParams(searchArgs);
    if (overrideArgs && typeof overrideArgs === 'object') {
      if (overrideArgs.minResult) searchParams.minResult = overrideArgs.minResult;
      if (overrideArgs.maxResult) searchParams.maxResult = overrideArgs.maxResult;
      if (searchParams.maxResult < searchParams.minResult) searchParams.maxResult = searchParams.minResult;
      if (overrideArgs.intro !== undefined) searchParams.intro = overrideArgs.intro;
      if (overrideArgs.sections !== undefined) searchParams.sections = overrideArgs.sections;
      if (overrideArgs.count) searchParams.count = overrideArgs.count;
      if (overrideArgs.maxTries) searchParams.maxTries = overrideArgs.maxTries;
      if (overrideArgs.template) searchParams.template = overrideArgs.template;
      if (overrideArgs.limit) searchParams.limit = overrideArgs.limit;
      if (overrideArgs.category) searchParams.category = overrideArgs.category;
      if (overrideArgs.privacy) searchParams.privacy = overrideArgs.privacy;
      if (overrideArgs.exact !== undefined) searchParams.exact = overrideArgs.exact;
      if (overrideArgs.keywordType) searchParams.keywordType = overrideArgs.keywordType;
      if (overrideArgs.keywordPlural !== undefined) searchParams.keywordPlural = overrideArgs.keywordPlural;
      if (overrideArgs.keywordDeterminer) searchParams.keywordDeterminer = overrideArgs.keywordDeterminer;
      if (overrideArgs.keywordNoun) searchParams.keywordNoun = overrideArgs.keywordNoun;
      if (overrideArgs.keywordList) searchParams.keywordList = overrideArgs.keywordList;
      if (overrideArgs.link) searchParams.link = overrideArgs.link;
      if (overrideArgs.amazon !== undefined) searchParams.amazon = overrideArgs.amazon;
      if (overrideArgs.cacheOnly !== undefined) searchParams.cacheOnly = overrideArgs.cacheOnly;
      if (overrideArgs.multipleOnly !== undefined) searchParams.multipleOnly = overrideArgs.multipleOnly;
      if (overrideArgs.assets) searchParams.assets = overrideArgs.assets;
      if (overrideArgs.images) searchParams.images = overrideArgs.images;
      if (overrideArgs.voice) searchParams.voice = overrideArgs.voice;
      if (overrideArgs.project) searchParams.project = overrideArgs.project;
      if (overrideArgs.clips) searchParams.clips = overrideArgs.clips;
      if (overrideArgs.stills) searchParams.stills = overrideArgs.stills;
      if (overrideArgs.slideshows) searchParams.slideshows = overrideArgs.slideshows;
      if (overrideArgs.keyword) searchParams.keyword = overrideArgs.keyword;
      if (overrideArgs.random !== undefined) searchParams.random = overrideArgs.random;
      if (overrideArgs.minLength) searchParams.minLength = overrideArgs.minLength;
      if (overrideArgs.matchRegex) searchParams.matchRegex = overrideArgs.matchRegex;
      if (overrideArgs.strict !== undefined) searchParams.strict = overrideArgs.strict;
      if (overrideArgs.shuffle !== undefined) searchParams.shuffle = overrideArgs.shuffle;
      if (overrideArgs.imageKeywords) searchParams.imageKeywords = overrideArgs.imageKeywords;
    }
    return searchParams;
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

  existsBlacklistCache: function(keyword) {
    if (fs.existsSync(this.cachePath + '/data/blacklist/' + keyword + '.json')) return true;
    return false;
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

  textFilename: function(keyword,index) {
    if (!keyword) throw new Error('Unable to generate filename without keyword.');
    if (!index) index = 1;
    let prefix = '';
    if (index > 9999) {
      prefix = '0';
    }
    else if (index > 999) {
      prefix = '00';
    }
    else if (index > 99) {
      prefix = '000';
    }
    else if (index > 9) {
      prefix = '0000';
    }
    else {
      prefix = '00000';
    }
    let path = this.cachePath + '/text/' + keyword + '/' + prefix + index + '.txt';
    if (fs.existsSync(path)) {
      index++;
      return this.textFilename(keyword,index);
    }
    else {
      return path;
    }
  },

  existsTextCache: function(keyword) {
    if (fs.existsSync(this.cachePath + '/data/text/' + keyword + '.json')) return true;
    return false;
  },

  existsTextCacheValue: function(keyword,property,value) {
    let file = this.cachePath + '/data/text/' + keyword + '.json';
    if (!fs.existsSync(file)) {
      return false;
    }
    let data = JSON.parse(fs.readFileSync(file));
    for (let i = 0; i < data.length; i++) {
      if (data[i][property] === value) return true;
    }
    return false;
  },

  createTextCache: function(keyword) {
    return new Promise((resolve,reject) => {
      if (!keyword) {
        reject('Unable to create text cache without keyword.');
      }
      else {
        if (fs.existsSync(this.cachePath + '/data/text/' + keyword + '.json') && fs.existsSync(this.cachePath + '/text/' + keyword)) {
          resolve('Text cache already exists for: ' + keyword);
        }
        else if (!fs.existsSync(this.cachePath + '/data/text/' + keyword + '.json') && fs.existsSync(this.cachePath + '/text/' + keyword)) {
          let data = [];
          fs.writeFile(this.cachePath + '/data/text/' + keyword + '.json', JSON.stringify(data), err => {
            if (err) {
              reject(err);
            }
            else {
              resolve('Text cache created for: ' + keyword);
            }
          });
        }
        else if (fs.existsSync(this.cachePath + '/data/text/' + keyword + '.json') && !fs.existsSync(this.cachePath + '/text/' + keyword)) {
          fs.mkdir(this.cachePath + '/text/' + keyword, err => {
            if (err) {
              reject(err);
            }
            else {
              resolve('Text cache created for: ' + keyword);
            }
          });
        }
        else {
          let data = [];
          fs.writeFile(this.cachePath + '/data/text/' + keyword + '.json', JSON.stringify(data), err => {
            if (err) {
              reject(err);
            }
            else {
              fs.mkdir(this.cachePath + '/text/' + keyword, err => {
                if (err) {
                  reject(err);
                }
                else {
                  resolve('Text cache created for: ' + keyword);
                }
              });
            }
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
            if (err) {
              reject(err);
            }
            else {
              resolve(data);
            }
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
          if (!indexes.length) {
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

  existsImageCache: function(keyword) {
    if (fs.existsSync(this.cachePath + '/data/images/' + keyword + '.json')) return true;
    return false;
  },

  existsImageCacheValue: function(keyword,property,value) {
    let file = this.cachePath + '/data/images/' + keyword + '.json';
    if (!fs.existsSync(file)) {
      return false;
    }
    let data = JSON.parse(fs.readFileSync(file));
    for (let i = 0; i < data.length; i++) {
      if (data[i][property] === value) return true;
    }
    return false;
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
        else if (!fs.existsSync(this.cachePath + '/data/images/' + keyword + '.json') && fs.existsSync(this.cachePath + '/images/' + keyword)) {
          let data = [];
          fs.writeFile(this.cachePath + '/data/images/' + keyword + '.json', JSON.stringify(data), err => {
            if (err) {
              reject(err);
            }
            else {
              resolve('Image cache created for: ' + keyword);
            }
          });
        }
        else if (fs.existsSync(this.cachePath + '/data/images/' + keyword + '.json') && !fs.existsSync(this.cachePath + '/images/' + keyword)) {
          fs.mkdir(this.cachePath + '/images/' + keyword, err => {
            if (err) {
              reject(err);
            }
            else {
              resolve('Image cache created for: ' + keyword);
            }
          });
        }
        else {
          let data = [];
          fs.writeFile(this.cachePath + '/data/images/' + keyword + '.json', JSON.stringify(data), err => {
            if (err) {
              reject(err);
            }
            else {
              fs.mkdir(this.cachePath + '/images/' + keyword, err => {
                if (err) {
                  reject(err);
                }
                else {
                  resolve('Image cache created for: ' + keyword);
                }
              });
            }
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
            if (err) {
              reject(err);
            }
            else {
              resolve(data);
            }
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
          if (!indexes.length) {
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
    if (!fs.existsSync(this.cachePath + '/text')) {
      if (this.debug) console.log('Text cache directory not found. Creating folder...');
      fs.mkdir(this.cachePath + '/text',err => {
        if (err && this.debug) console.log(err);
        if (this.debug) console.log('Finished creating text cache directory.');
      });
    }
    if (!fs.existsSync(this.cachePath + '/images')) {
      if (this.debug) console.log('Image cache directory not found. Creating folder...');
      fs.mkdir(this.cachePath + '/images',err => {
        if (err && this.debug) console.log(err);
        if (this.debug) console.log('Finished creating image cache directory.');
      });
    }
    if (!fs.existsSync(this.cachePath + '/images/stills')) {
      if (this.debug) console.log('Image stills cache directory not found. Creating folder...');
      fs.mkdir(this.cachePath + '/images/stills',err => {
        if (err && this.debug) console.log(err);
        if (this.debug) console.log('Finished creating image stills cache directory.');
      });
    }
    else {
      if (this.debug) console.log('Image stills cache directory already exists.');
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
              filename: this.parseImageFilename(path.basename(photos[i].ou.split('?')[0])),
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
              filename: this.parseImageFilename(path.basename(photos[i].sizes[size].url.split('?')[0])),
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
          }).catch(err => reject(err));
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

  parseImageFilename(filename) {
    if (!filename || typeof filename !== 'string') {
      return '';
    }
    return filename.replace(/[^a-zA-Z0-9\-\_\.]/g,'');
  },

  parseHeader: function(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    text = text
    .replace(/^[^A-Za-z]*([A-Za-z])/,'$1')
    .replace(/([a-zA-Z])(\:\s.+|\s\(.+|\s\-\s.+|\s\|\s.+|\,\s.+)/,'$1')
    .replace(/\!+/g,'!')
    .replace(/\?+/g,'?')
    .replace(/\.+/g,'.')
    .replace(/\s+/g,' ')
    .replace(/(\u201C|\u201D|\u2033|\u201e)/g,'"')
    .replace(/(\u2018|\u2019|\u201a|\u2032)/g,'\'')
    .replace(/(\u2026)/g,'.')
    .replace(/[\.\?\!]$/,'')
    .replace(/\<.+\>/g,'')
    .replace(/\[.+\]/g,'')
    .replace(/.+\d+\s+([A-Z])/g,'$1')
    .replace(/.+[a-z][A-Z].+/g,'');
    if (text) return pos.titlecase(text);
    return '';
  },

  parseText: function(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    text = text
    .replace(/\!+/g,'!')
    .replace(/\?+/g,'?')
    .replace(/\.+/g,'.')
    .replace(/\s+/g,' ')
    .replace(/(\u201C|\u201D|\u2033|\u201e)/g,'"')
    .replace(/(\u2018|\u2019|\u201a|\u2032)/g,'\'')
    .replace(/(\u2026)/g,'.')
    .replace(/(\.|\?|\!|\:)\s/g,'$1\n')
    .replace(/\n([a-z])/g,' $1')
    .replace(/\<.+\>/g,'')
    .replace(/\[.+\]/g,'')
    .replace(/\d+\s+([A-Z])/g,'$1')
    .replace(/^\s+/g,'')
    .replace(/\n\s+/g,'\n')
    .replace(/.+[a-z][A-Z].+/g,'')
    .replace(/\.\"/g,'".');
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

  validateHeader: function(sentence) {
    if (!sentence || typeof sentence !== 'string') {
      return false;
    }
    if (sentence.match(/[a-z][A-Z]/g)) return false;
    if (sentence.match(/[^a-zA-Z\s\,\/\-0-9\#]/g)) return false;
    if (!sentence.match(/^#*[A-Z]/g)) return false;
    return true;
  },

  validateText: function(sentence) {
    if (!sentence || typeof sentence !== 'string') {
      return false;
    }
    if (sentence.match(/[a-z][A-Z]/g)) return false;
    if (!sentence.match(/\s[a-z]+\s[a-z]/g)) return false;
    if (sentence.match(/[\.\,\?\!\;\&\/][\.\,\?\!\;\&\/]/g)) return false;
    if (!sentence.match(/[\!\.\?]$/g)) return false;
    if (!sentence.match(/^[A-Z]/g)) return false;
    if (!sentence.match(/\s[a-z]/g)) return false;
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
    let parsedHeader = header.replace(/[^a-zA-Z0-9]/g,' ').replace(/\s+/g,' ').toLowerCase();
    for (let i = 0; i < keywordList.length; i++) {
      if (parsedHeader.includes(keywordList[i])) return keywordList[i];
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
      regex = /\b(tips|how.to|ideas)\b/gi;
      if (link.url.match(regex) || link.text.match(regex)) return true;
      return false;
      case 'facts':
      regex = /\b(facts|info|information)\b/gi;
      if (link.url.match(regex) || link.text.match(regex)) return true;
      case 'pitfalls':
      regex = /\b(pitfalls|traps|mistakes)\b/gi;
      if (link.url.match(regex) || link.text.match(regex)) return true;
      case 'list':
      regex = /\b(list|best|top|\d+.\w+)\b/gi;
      if (link.url.match(regex) || link.text.match(regex)) return true;
      return false;
      case 'products':
      regex = /\b(\d\d)\b/gi;
      if (link.url.match(regex) || link.text.match(regex)) return true;
      return false;
      case 'review':
      regex = /\b(review)\b/gi;
      if (link.url.match(regex) || link.text.match(regex)) return true;
      return false;
      default: return false;
    }
  },

  filterBodyContent: function(paragraph) {
    if (!paragraph || typeof paragraph !== 'string') {
      return [];
    }
    let splitParagraph = paragraph.split('|||||');
    if (!this.validateParagraph(splitParagraph.join(' '))) return [];
    let filtered = [];
    for (let i = 0; i < splitParagraph.length; i++) {
      if (this.validateText(splitParagraph[i])) filtered.push(splitParagraph[i]);
    }
    if (filtered.length) return filtered;
    return [];
  },

  extractBody: function($,headerPrefix) {
    return new Promise((resolve,reject) => {
      if (!headerPrefix) headerPrefix = '#';
      let lines = ['!!!'];
      let self = this;
      let start = false;
      $('*').filter(function(i,el) {
        let text;
        if (el.name === 'h1') start = true;
        if (el.name === 'h1' || el.name === 'h2' || el.name === 'h3' || el.name === 'h4' || el.name === 'h5' || el.name === 'h6') {
          if (start) return $(this);
        }
        else if (el.name === 'ol' || el.name === 'ul') {
          if (start) return $(this);
        }
        else if (el.name === 'p' || (el.type === 'text' && el.parentNode && el.parentNode.name === 'div')) {
          if (start) return $(this);
        }
      }).each(function(i,el) {
        let text;
        if (el.name === 'h1') start = true;
        if (el.name === 'h1' || el.name === 'h2' || el.name === 'h3' || el.name === 'h4' || el.name === 'h5' || el.name === 'h6') {
          text = '\n' + headerPrefix + self.parseHeader($(this).text());
        }
        else if (el.name === 'ol' || el.name === 'ul') {
          text = self.parseText($(this).text());
        }
        else if (el.name === 'p' || (el.type === 'text' && el.parentNode && el.parentNode.name === 'div')) {
          text = self.parseText($(this).text());
        }
        if (start && text && !lines.includes(text)) {
          lines.push(text);
        }
      });
      resolve(lines.join('\n'));
    });
  },

  webpage: function(url,headerPrefix) {
    return new Promise((resolve,reject) => {
      if (!headerPrefix) headerPrefix = '#';
      let options = {
        method: 'GET',
        uri: url,
        gzip: true,
        rejectUnauthorized: false,
        timeout: this.timeout,
        headers: {'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:20.0) Gecko/20100101 Firefox/20.0'}
      };
      if (this.debug) console.log('Requesting webpage: ' + url);
      request(options).then(html => {
        let $ = cheerio.load(html);
        this.extractBody($,headerPrefix).then(data => {
          let pageObject = {
            title: $('title').text() || '',
            description: $('meta[name="description"]').attr('content') || '',
            keywords: $('meta[name="keywords"]').attr('content') || '',
            url: url,
            body: data
          };
          resolve(pageObject);
        }).catch(err => reject(err));
      }).catch(err => reject(err));
    });
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
    $('.s-result-item.celwidget:not(.AdHolder)').each(function(i,el) {
      let asin = $(this).attr('data-asin');
      let url = $(this).find('.a-link-normal.s-access-detail-page.s-color-twister-title-link.a-text-normal').attr('href');
      let text = $(this).find('.a-link-normal.s-access-detail-page.s-color-twister-title-link.a-text-normal').text();
      links.push({url: url, text: text, keyword: keyword, asin: asin});
    });
    return links;
  },

  googleSearch: function(keyword,minResult,maxResult,domain) {
    return new Promise((resolve,reject) => {
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
          timeout: this.timeout,
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
          timeout: this.timeout,
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
          timeout: this.timeout,
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

  parseAmazonProduct: function($,link) {
    let obj = {};
    let self = this;
    obj.amazon = true;
    obj.asin = link.asin;
    obj.url = link.url;
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
      return $(this).text().replace(/\n\W+/g,' ').replace(/\s+/g,' ').trim();
    }).get();
    obj.dimensions = '';
    obj.weight = '';
    $('#detailBullets_feature_div li').each(function(i,el) {
      let text = $(this).text().replace(/\n/g,'').replace(/\s+/g,' ').trim();
      if (text.match(/product\s+dimensions:\s+/gi)) {
        obj.dimensions = text.replace(/product\s+dimensions:\s+/gi,'');
      }
      else if (text.match(/shipping\s+weight:\s+/gi)) {
        obj.weight = text.replace(/shipping\s+weight:\s+/gi,'').replace(/\s+\(.+/gi,'');
      }
    });
    obj.description = [];
    $('#productDescription p').each(function(i,el) {
      if ($(this).contents().length) {
        $(this).contents().each(function(i,sub) {
          let text = self.parseText($(this).text());
          let filtered = self.filterBodyContent(text);
          if (filtered.length) obj.description = obj.description.concat(filtered);
        });
      }
      else {
        let text = self.parseText($(this).text());
        let filtered = self.filterBodyContent(text);
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
            if (!imageSizes[j].match(/"hiRes":null/g) && imageSizes[j].match(/"hiRes":"(.+)"/g)) {
              let img = imageSizes[j].replace(/"hiRes":"(.+)"/,'$1');
              if (!img.match(/^http.+\.jpg$/g)) continue;
              let imgObject = {
                image: img,
                url: img,
                title: obj.title,
                author: obj.brand,
                width: 0,
                height: 0,
                description: '',
                filename: self.parseImageFilename(path.basename(img.split('?')[0])),
                search: [],
                tags: [],
                copyright: true
              };
              obj.images.push(imgObject);
              break;
            }
            else if (!imageSizes[j].match(/"large":null/g) && imageSizes[j].match(/"large":"(.+)"/g)) {
              let img = imageSizes[j].replace(/"large":"(.+)"/,'$1');
              if (!img.match(/^http.+\.jpg$/g)) continue;
              let imgObject = {
                image: img,
                url: img,
                title: obj.title,
                author: obj.brand,
                width: 0,
                height: 0,
                description: '',
                filename: self.parseImageFilename(path.basename(img.split('?')[0])),
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
    if (!obj.images.length) return null;
    return obj;
  },

  amazonProduct: function(link) {
    return new Promise((resolve,reject) => {
      if (!link || !link.text || !link.url || !link.keyword || !link.asin) {
        reject('Unable to download Amazon page without link object.');
      }
      else {
        if (this.existsImageCache(link.asin)) {
          let msg = 'Amazon product already exists in image cache: ' + link.text;
          resolve({msg: msg, count: 0});
        }
        else if (this.existsBlacklistCache(link.asin)) {
          let msg = 'Amazon product already exists in blacklist cache: ' + link.text;
          resolve({msg: msg, count: 0});
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
          request(options).then(html => {
            if (this.debug) console.log('Loading Amazon product page: ' + link.text);
            let $ = cheerio.load(html);
            let obj = this.parseAmazonProduct($,link);
            if (obj) {
              this.updateTextCache(obj,link.keyword).then(textData => {
                if (this.debug) console.log(textData);
                this.updateImageCacheMultiple(obj.images,link.asin,false).then(imageData => {
                  if (this.debug) console.log(imageData);
                  let msg = 'Finished adding Amazon product to text and image cache: ' + link.text;
                  resolve({msg: msg, count: 1});
                }).catch(err => reject(err));
              }).catch(err => reject(err));
            }
            else {
              this.updateBlacklistCache(link.url,link.asin).then(msg => {
                if (this.debug) console.log(msg);
                reject('No Amazon product found to add to text and image cache: ' + link.text);
              }).catch(err => reject(err));
            }
          }).catch(err => reject(err));
        }
      }
    });
  },

  amazonProductMultiple: function(links,count) {
    return new Promise((resolve,reject) => {
      if (!links) {
        reject('Unable to download Amazon pages without link object array.');
      }
      else if (links[0]) {
        if (!count) count = 0;
        this.amazonProduct(links[0]).then(data => {
          if (this.debug) console.log(data.msg);
          count += data.count;
          links.shift();
          if (links.length) {
            this.amazonProductMultiple(links,count).then(data => resolve(data)).catch(err => reject(err));
          }
          else {
            let msg = `Finished downloading ${count} Amazon pages.`;
            resolve({msg: msg, count: count});
          }
        }).catch(err => {
          if (this.debug) console.log(err);
          links.shift();
          if (links.length) {
            this.amazonProductMultiple(links,count).then(data => resolve(data)).catch(err => reject(err));
          }
          else {
            let msg = `Finished downloading ${count} Amazon pages.`;
            resolve({msg: msg, count: count});
          }
        })
      }
    });
  },

  amazonPages: function(keyword,searchArgs,limit,pages) {
    return new Promise((resolve,reject) => {
      if (!keyword) {
        reject('Unable to search for Amazon pages without keyword.');
      }
      else {
        let searchParams = this.setSearchParams(searchArgs);
        if (!limit) limit = searchParams.limit;
        if (!pages) pages = 0;
        this.amazonSearch(keyword,searchParams.minResult,searchParams.maxResult).then(data => {
          this.amazonProductMultiple(data).then(products => {
            if (this.debug) console.log(products.msg);
            searchParams.minResult += 1;
            pages += products.count;
            limit--;
            if (limit > 0) {
              this.amazonPages(keyword,searchParams,limit,pages).then(data => resolve(data)).catch(err => reject(err));
            }
            else {
              if (pages) {
                resolve(`Resolving ${pages} pages for Amazon keyword: ${keyword}`);
              }
              else {
                reject(`No pages found for Amazon keyword: ${keyword}`);
              }
            }
          }).catch(err => reject(err));
        }).catch(err => {
          if (this.debug) console.log(err);
          searchParams.minResult += 1;
          limit--;
          if (limit > 0) {
            this.amazonPages(keyword,searchParams,limit,pages).then(data => resolve(data)).catch(err => reject(err));
          }
          else {
            if (pages) {
              resolve(`Resolving ${pages} pages for Amazon keyword: ${keyword}`);
            }
            else {
              reject(err);
            }
          }
        });
      }
    });
  },

  amazonKeywords: function(data) {
    if (!data || typeof data !== 'object') {
      if (this.debug) console.log('Unable to filter Amazon keywords without data.');
      return [];
    }
    let keywords = [];
    for (let i = 0; i < data.length; i++) {
      let obj = {
        header: this.parseHeader(data[i].title),
        keyword: data[i].asin
      };
      if (obj.header && obj.keyword) keywords.push(obj);
    }
    if (keywords.length) keywords = shuffle(keywords);
    return keywords;
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

  filterUsedImages: function(imageData,usedImages) {
    if (!imageData || !usedImages) {
      throw new Error('Unable to filter images without image data.');
    }
    let images = [];
    if (imageData.length) images = imageData.filter(el => !usedImages.includes(el.image));
    return images;
  },

  videoProperties: function(obj,searchArgs,imageArgs,usedImages,firstSlide) {
    return new Promise((resolve,reject) => {
      if (!obj || !searchArgs || !imageArgs || !imageArgs.fallback) {
        reject('Unable to create video properties without page object and image parameters.');
      }
      else {
        if (!usedImages) usedImages = [];
        let searchParams = this.setSearchParams(searchArgs);
        let imageParams = this.setImageParams(imageArgs);
        let slides = [];
        let credits = [];
        let count = obj.count;
        let keyword = obj.keyword ? obj.keyword : imageParams.fallback;
        let titleFallback = searchParams.keywordList.length ? pos.titlecase(rand(...searchParams.keywordList)) : pos.titlecase(searchParams.keyword);
        this.images(keyword,imageParams).then(data => {
          data = this.filterUsedImages(data,usedImages);
          let imageActive = true;
          let textActive = true;
          if (imageParams.template.includes('imageOnly') || imageParams.template.includes('imageAudio')) textActive = false;
          if (imageParams.template.includes('textOnly')) imageActive = false;
          let bothActive = imageActive && textActive ? true : false;
          if (obj.text.length) {
            if (obj.header || firstSlide) {
              let titleText = '';
              let titleImage = null;
              let titleTemplate = '';
              if (imageActive && firstSlide) {
                if (data[0]) titleImage = data[0];
                if (titleImage) {
                  usedImages.push(data[0].image);
                  data.shift();
                }
                if (textActive) titleText = !firstSlide ? obj.header : titleFallback;
                titleTemplate = imageParams.template ? imageParams.template + ' noTransitionA' : 'noTransitionA';
              }
              else if (textActive) {
                titleText = !firstSlide ? obj.header : titleFallback;
                titleTemplate = imageParams.template;
                titleImage = null;
              }
              let titleObj = {
                text: titleText,
                audio: '',
                image: titleImage,
                template: titleTemplate,
                keyword: keyword
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
                slideImage = data[0] ? rand(data[0],data[0],data[0],null) : null;
                if (slideImage)  {
                  usedImages.push(data[0].image);
                  data.shift();
                }
                slideText = !slideImage ? snippet : rand(snippet,'');
              }
              else if (imageActive) {
                slideImage = data[0] ? data[0] : null;
                if (slideImage)  {
                  usedImages.push(data[0].image);
                  data.shift();
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
                keyword: keyword
              };
              if (slideObj.text || slideObj.image) {
                let slideCredit = this.imageCredit(slideObj.image);
                if (slideCredit && !slideObj.image.copyright) credits.push(slideCredit);
                slides.push(slideObj);
              }
            }
          }
          else {
            let slideText = '';
            let slideImage = null;
            let slideTemplate = '';
            if (obj.header && !imageParams.template.includes('imageOnly')) {
              slideText = !firstSlide ? obj.header : titleFallback;
              slideTemplate = imageParams.template ? imageParams.template + ' noTransitionA' : 'noTransitionA';
              slideImage = firstSlide ? data[0] : null;
              if (slideImage) {
                usedImages.push(data[0].image);
                data.shift();
              }
            }
            else {
              slideText = '';
              slideTemplate = imageParams.template ? imageParams.template + ' noTransitionA' : 'noTransitionA';
              if (data[0]) slideImage = data[0];
              if (slideImage) {
                usedImages.push(data[0].image);
                data.shift();
              }
            }
            let slideObj = {
              text: slideText,
              audio: '',
              image: slideImage,
              template: slideTemplate,
              keyword: keyword
            };
            if (slideObj.text || slideObj.image) {
              let slideCredit = this.imageCredit(slideObj.image);
              if (slideCredit && !slideObj.image.copyright) credits.push(slideCredit);
              slides.push(slideObj);
            }
          }
          if (slides.length) {
            if (this.debug) console.log('Resolving video properties: ' + keyword);
            resolve({slides: slides, credits: credits, count: count});
          }
          else {
            reject('No video properties found from: ' + obj.url);
          }
        }).catch(err => reject(err));
      }
    });
  },

  videoPropertiesMultiple: function(objs,searchArgs,imageArgs,usedImages,slideStore,index) {
    return new Promise((resolve,reject) => {
      if (!objs || !searchArgs || !imageArgs || !imageArgs.fallback) {
        reject('Unable to create multiple video properties without page object array and image parameters.');
      }
      else {
        if (!usedImages) usedImages = [];
        let searchParams = this.setSearchParams(searchArgs);
        let imageParams = this.setImageParams(imageArgs);
        if (!slideStore) slideStore = {
          slides: [],
          credits: [],
          count: 0
        };
        if (!index) index = 0;
        let firstSlide = false;
        if (!slideStore.slides.length) firstSlide = true;
        if (objs && index < objs.length) {
          this.videoProperties(objs[index],searchParams,imageParams,usedImages,firstSlide).then(data => {
            slideStore.slides = slideStore.slides.concat(data.slides);
            slideStore.credits = slideStore.credits.concat(data.credits);
            slideStore.count += data.count;
            index++;
            if (objs && index >= objs.length) {
              if (this.debug) console.log('Resolving multiple video properties: ' + searchParams.keyword);
              if (imageParams.tagline) {
                slideStore.slides.push({
                  text: imageParams.tagline,
                  audio: '',
                  image: null,
                  template: 'noTransitions',
                  keyword: ''
                });
              }
              if (imageParams.logo && searchParams.stills) {
                slideStore.slides.push({
                  text: '',
                  audio: '',
                  image: imageParams.logo,
                  template: 'noTransitions stillImage',
                  keyword: searchParams.stills
                });
              }
              resolve(slideStore);
            }
            else {
              this.videoPropertiesMultiple(objs,searchParams,imageParams,usedImages,slideStore,index).then(data => resolve(data)).catch(err => reject(err));
            }
          }).catch(err => {
            if (this.debug) console.log(err);
            index++;
            if (objs && index >= objs.length) {
              if (this.debug) console.log('Resolving multiple video properties: ' + searchParams.keyword);
              if (imageParams.tagline) {
                slideStore.slides.push({
                  text: imageParams.tagline,
                  audio: '',
                  image: null,
                  template: 'noTransitions',
                  keyword: ''
                });
              }
              if (imageParams.logo && searchParams.stills) {
                slideStore.slides.push({
                  text: '',
                  audio: '',
                  image: imageParams.logo,
                  template: 'noTransitions stillImage',
                  keyword: searchParams.stills
                });
              }
              resolve(slideStore);
            }
            else {
              this.videoPropertiesMultiple(objs,searchParams,imageParams,usedImages,slideStore,index).then(data => resolve(data)).catch(err => reject(err));
            }
          });
        }
        else {
          reject('No video properties found from: ' + searchParams.keyword);
        }
      }
    });
  },

  readDataObjects: function(objects,index,searchArgs) {
    if (!objects || typeof objects !== 'object' || !objects.length || typeof index !== 'number') {
      return null;
    }
    let searchParams = this.setSearchParams(searchArgs);
    if (!searchParams.amazon) {
      let text = fs.readFileSync(objects[index].filename,'utf8');
      return this.textObjects(text,searchParams);
    }
    else {
      let searchLowerBound = Math.ceil(searchParams.count/2);
      let searchCount = searchParams.count;
      let data = [];
      objects = shuffle(objects);
      if (searchParams.random) searchCount = Math.floor(Math.random() * (searchParams.count - searchLowerBound + 1)) + searchLowerBound;
      for (let i = 0; i < searchCount; i++) {
        let text = this.amazonText(objects[i],searchParams.sections);
        if (text) data.push(text);
      }
      return data;
    }
  },

  amazonText: function(data,limit) {
    if (!data || typeof data !== 'object') {
      if (this.debug) console.log('Unable to generate Amazon text without data.');
      return null;
    }
    let text = [];
    let arrays = [];
    let strings = [];
    let lists = [];
    if (!data.title) return null;
    if (data.description.length) arrays.push('description');
    if (data.features.length) arrays.push('features');
    if (data.price.length) strings.push('price');
    if (data.rating.length) strings.push('rating');
    if (data.colors.length) lists.push('colors');
    if (data.sizes.length) lists.push('sizes');
    if (!arrays.length) return null;
    for (let i = 0; i < arrays.length; i++) {
      if (!data[arrays[i]].length) continue;
      let lines = shuffle(data[arrays[i]]).slice(0,limit).join(' ');
      text.push(lines);
    }
    return {
      header: this.parseHeader(data.title),
      text: text,
      keyword: data.asin,
      count: 1
    };
  },

  textObjects: function(data,searchArgs) {
    if (!data || typeof data !== 'string') {
      if (this.debug) console.log('Unable to generate content paragraphs without text data.');
      return [];
    }
    else {
      let searchParams = this.setSearchParams(searchArgs);
      let text = data.split('\n');
      if (searchParams.strict && text[0] && text[0] === '!!!') {
        if (this.debug) console.log('Unable to parse unedited text file.');
        return [];
      }
      else {
        let paragraphs = [];
        for (let i = 0; i < text.length; i++) {
          if (!text[i]) continue;
          let x = paragraphs.length-1;
          if (text[i].match(/^(\#|\*)/g)) {
            if (paragraphs[x] && paragraphs[x].header && !paragraphs[x].text.length) {
              paragraphs.pop();
            }
            let header = text[i].slice(1).trim();
            let keyword = text[i].match(/^\*/g) ? text[i].slice(1).toLowerCase().trim() : '';
            let count = keyword ? 1 : 0;
            let obj = {
              text: [],
              header: header,
              keyword: keyword,
              count: count
            };
            paragraphs.push(obj);
          }
          else {
            let line = text[i].trim();
            line = line.match(/^\w/g) && line.match(/(\.|\?|\!)$/g) ? line : '';
            if (!line) continue;
            if (paragraphs[x]) {
              paragraphs[x].text.push(text[i]);
            }
            else {
              let obj = {
                text: [text[i]],
                header: '',
                keyword: '',
                count: 0
              };
              paragraphs.push(obj);
            }
          }
        }
        let filteredParagraphs = [];
        paragraphs = paragraphs.filter(el => el.text.length && el.text.length > searchParams.minLength && (!searchParams.matchRegex || !el.header.match(searchParams.matchRegex)));
        if (searchParams.shuffle) {
          let intro = paragraphs[0];
          let body = paragraphs.length > 1 ? shuffle(paragraphs.slice(1)) : [];
          paragraphs = [intro].concat(body);
        }
        let searchLowerBound = Math.ceil(searchParams.count/2);
        let searchCount = searchParams.count;
        if (searchParams.random) searchCount = Math.floor(Math.random() * (searchParams.count - searchLowerBound + 1)) + searchLowerBound;
        for (let i = 0; i < paragraphs.length; i++) {
          if (filteredParagraphs.length >= searchCount) break;
          let maxResult = i === 0 ? searchParams.intro : searchParams.sections;
          if (!maxResult) continue;
          let minResult = Math.ceil(maxResult/2);
          let spliceIndex = maxResult;
          if (searchParams.random) spliceIndex = Math.floor(Math.random() * (maxResult - minResult + 1)) + minResult;
          let paragraph = {
            text: paragraphs[i].text.slice(0,spliceIndex),
            header: paragraphs[i].header,
            keyword: paragraphs[i].keyword,
            count: paragraphs[i].count
          };
          filteredParagraphs.push(paragraph);
        }
        return filteredParagraphs;
      }
    }
  },

  slideshowObjects: function(keyword,searchArgs,imageArgs) {
    if (!keyword || typeof keyword !== 'string' || !searchArgs || !imageArgs) {
      if (this.debug) console.log('Unable to produce slideshow paragraphs without keyword and parameters.');
      return [];
    }
    let paragraphs = [];
    let searchParams = this.setSearchParams(searchArgs);
    let imageParams = this.setImageParams(imageArgs);
    let searchLowerBound = Math.ceil(searchParams.count/2);
    let searchCount = searchParams.count;
    if (searchParams.random) searchCount = Math.floor(Math.random() * (searchParams.count - searchLowerBound + 1)) + searchLowerBound;
    let imageLowerBound = Math.ceil(imageParams.count/2);
    if (searchParams.imageKeywords && searchParams.imageKeywords.length) {
      if (searchCount > searchParams.imageKeywords.length) searchCount = searchParams.imageKeywords.length;
      if (!imageParams.template.includes('imageOnly')) {
        let title = {
          text: [],
          header: pos.titlecase(keyword),
          keyword: imageParams.fallback,
          count: 0
        };
        paragraphs.push(title);
      }
      if (!searchParams.amazon) {
        for (let i = 0; i < searchCount; i++) {
          let title = {
            text: [],
            header: pos.titlecase(searchParams.imageKeywords[i]),
            keyword: searchParams.imageKeywords[i],
            count: 1
          };
          paragraphs.push(title);
          let imageCount = imageParams.count;
          if (imageParams.random) imageCount = Math.floor(Math.random() * (imageParams.count - imageLowerBound + 1)) + imageLowerBound;
          for (let j = 0; j < imageCount; j++) {
            let image = {
              text: [],
              header: '',
              keyword: searchParams.imageKeywords[i],
              count: 0
            };
            paragraphs.push(image);
          }
        }
      }
      else {
        for (let i = 0; i < searchCount; i++) {
          let title = {
            text: [],
            header: pos.titlecase(searchParams.imageKeywords[i].header),
            keyword: searchParams.imageKeywords[i].keyword,
            count: 1
          };
          paragraphs.push(title);
          let imageCount = imageParams.count;
          if (imageParams.random) imageCount = Math.floor(Math.random() * (imageParams.count - imageLowerBound + 1)) + imageLowerBound;
          for (let j = 0; j < imageCount; j++) {
            let image = {
              text: [],
              header: '',
              keyword: searchParams.imageKeywords[i].keyword,
              count: 0
            };
            paragraphs.push(image);
          }
        }
      }
    }
    else {
      for (let i = 0; i < searchCount; i++) {
        let image = {
          text: [],
          header: '',
          keyword: imageParams.fallback,
          count: 1
        };
        paragraphs.push(image);
      }
    }
    return paragraphs;
  },

  video: function(keyword,dataObject,searchArgs,imageArgs,matchKeyword) {
    return new Promise((resolve,reject) => {
      if (!keyword) {
        reject('Unable to create video without keyword.');
      }
      else {
        let searchParams = this.setSearchParams(searchArgs);
        let imageParams = this.setImageParams(imageArgs);
        searchParams.keyword = keyword;
        let text;
        if (!dataObject) {
          text = this.slideshowObjects(keyword,searchParams,imageParams);
        }
        else {
          text = dataObject.amazon ? dataObject.description : this.pageParagraphs(dataObject,searchParams,true);
        }
        if (text && text.length) {
          this.videoPropertiesMultiple(text,searchParams,imageParams).then(data => {
            let titleKeyword = (matchKeyword || !searchParams.keywordList.length) ? keyword : rand(...searchParams.keywordList,keyword);
            let promoKeyword = searchParams.keywordList.length ? rand(...searchParams.keywordList) : keyword;
            let slides = {
              title: pos.title(titleKeyword,searchParams.keywordType,searchParams.template,data.count),
              category: searchParams.category,
              privacy: searchParams.privacy,
              clips: data.slides,
              keywords: shuffle(searchParams.keywordList),
              count: data.count
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
        }
        else {
          reject('No text object found for video keyword: ' + keyword);
        }
      }
    });
  },

  downloadResults: function(keyword,results,store) {
    return new Promise((resolve,reject) => {
      if (!results) {
        reject('Unable to download pages without search results.');
      }
      else {
        if (!store) store = [];
        if (results[0]) {
          this.webpage(results[0].url).then(page => {
            let textFile = this.textFilename(keyword);
            let textObj = {
              filename: textFile,
              title: page.title,
              description: page.description,
              keywords: page.keywords,
              url: page.url
            };
            if (!this.existsTextCacheValue(keyword,'url',textObj.url)) {
              if (!fs.existsSync(this.cachePath + '/text/' + keyword)) {
                fs.mkdir(this.cachePath + '/text/' + keyword, err => {
                  if (err) {
                    reject(err);
                  }
                  else {
                    fs.writeFile(textFile,page.body, err => {
                      if (this.debug) {
                        if (err) {
                          console.log(err);
                        }
                        else {
                          console.log('Finished writing text file to: ' + textFile);
                        }
                      }
                    });
                  }
                });
              }
              else {
                fs.writeFile(textFile,page.body, err => {
                  if (this.debug) {
                    if (err) {
                      console.log(err);
                    }
                    else {
                      console.log('Finished writing text file to: ' + textFile);
                    }
                  }
                });
              }
            }
            else {
              if (this.debug) console.log('Text file already saved to cache: ' + textFile);
            }
            store.push(textObj);
            results.shift();
            this.downloadResults(keyword,results,store).then(data => resolve(data)).catch(err => reject(err));
          }).catch(err => {
            if (this.debug) console.log(err);
            results.shift();
            this.downloadResults(keyword,results,store).then(data => resolve(data)).catch(err => reject(err));
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
        if (!limit) limit = searchParams.limit;
        if (!pages) pages = 0;
        this.search(keyword,searchParams.minResult,searchParams.maxResult).then(results => {
          this.downloadResults(keyword,results).then(text => {
            let textCount = text.length;
            this.updateTextCacheMultiple(text,keyword).then(msg => {
              if (this.debug) console.log(msg);
              searchParams.minResult += 10;
              searchParams.maxResult += 10;
              pages += textCount;
              limit--;
              if (limit > 0) {
                this.pages(keyword,searchParams,limit,pages).then(data => resolve(data)).catch(err => reject(err));
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
          }).catch(err => reject(err));
        }).catch(err => reject(err));
      }
    });
  },

  videosFromKeyword: function(keyword,searchArgs,imageArgs,searchOverrideArgs,imageOverrideArgs,objectStore,dataStore,index) {
    return new Promise((resolve,reject) => {
      if (!keyword || typeof keyword !== 'string' || !searchArgs || !imageArgs) {
        reject('Unable to create videos without keyword and search/image parameters.');
      }
      else {
        if (!searchOverrideArgs) searchOverrideArgs = null;
        if (!imageOverrideArgs) imageOverrideArgs = null;
        if (!objectStore) objectStore = null;
        if (!dataStore) dataStore = [];
        if (!index) index = 0;
        let searchParams = this.overrideSearchParams(searchArgs,searchOverrideArgs);
        let imageParams = this.overrideImageParams(imageArgs,imageOverrideArgs);
        searchParams.keyword = keyword;
        if (!objectStore && (searchParams.amazon || (!imageParams.template.includes('imageOnly') && !imageParams.template.includes('imageTitle')))) {
          if (!fs.existsSync(this.cachePath + '/data/text/' + keyword + '.json')) {
            reject('No text data found to produce videos from keyword: ' + keyword);
          }
          else {
            this.readTextCache(keyword).then(data => {
              objectStore = JSON.parse(data);
              if (objectStore.length) {
                if (searchParams.amazon) {
                  objectStore = objectStore.filter(el => el.amazon);
                }
                else {
                  objectStore = objectStore.filter(el => !el.amazon);
                }
                if (objectStore.length) {
                  objectStore = shuffle(objectStore);
                  this.videosFromKeyword(keyword,searchParams,imageParams,searchOverrideArgs,imageOverrideArgs,objectStore,dataStore,index).then(data => resolve(data)).catch(err => reject(err));
                }
                else {
                  reject('No data found in cache for video keyword: ' + keyword);
                }
              }
              else {
                reject('No data found in cache for video keyword: ' + keyword);
              }
            }).catch(err => reject(err));
          }
        }
        else {
          if ((objectStore && objectStore.length && index < objectStore.length) || (objectStore === null && index < searchParams.slideshows)) {
            let obj = null;
            if (objectStore && !searchParams.amazon) {
              obj = objectStore[index];
            }
            else if (objectStore) {
              if (imageParams.template.includes('imageOnly') || imageParams.template.includes('imageTitle')) {
                searchParams.imageKeywords = this.amazonKeywords(objectStore);
              }
            }
            this.video(keyword,obj,searchParams,imageParams,false).then(video => {
              if (!searchParams.multipleOnly || (searchParams.multipleOnly && video.count > 1)) {
                dataStore.push(video);
              }
              index++;
              this.videosFromKeyword(keyword,searchParams,imageParams,searchOverrideArgs,imageOverrideArgs,objectStore,dataStore,index).then(data => resolve(data)).catch(err => reject(err));
            }).catch(err => {
              if (this.debug) console.log(err);
              index++;
              this.videosFromKeyword(keyword,searchParams,imageParams,searchOverrideArgs,imageOverrideArgs,objectStore,dataStore,index).then(data => resolve(data)).catch(err => reject(err));
            });
          }
          else if (dataStore.length) {
            fs.writeFile(searchParams.assets + searchParams.clips,JSON.stringify(dataStore),err => {
              if (err) {
                reject(err);
              }
              else {
                fcp.init(searchParams.assets,searchParams.images,searchParams.voice);
                fcp.xml(dataStore,searchParams.project);
                fcp.write();
                resolve('Video XML successfully saved to: ' + searchParams.assets);
              }
            });
          }
          else {
            reject('No videos produced for keyword: ' + keyword);
          }
        }
      }
    });
  },

  videosFromFile: function(filePath,dataStore,index) {
    return new Promise((resolve,reject) => {
      if (!filePath || typeof filePath !== 'string') {
        reject('Unable to create videos without file path.');
      }
      else {
        let data = require(filePath);
        if (!dataStore) dataStore = [];
        if (!index) index = 0;
        let object = data.objects[index];
        let searchParams, imageParams;
        if (object) {
          searchParams = this.overrideSearchParams(data.search,object.search);
          imageParams = this.overrideImageParams(data.image,object.image);
        }
        else {
          searchParams = this.overrideSearchParams(data.search,null);
          imageParams = this.overrideImageParams(data.image,null);
        }
        if (index < data.objects.length) {
          let objectStore = null;
          if (searchParams.amazon || (!imageParams.template.includes('imageOnly') && !imageParams.template.includes('imageTitle'))) {
            if (!fs.existsSync(this.cachePath + '/data/text/' + object.keyword + '.json')) {
              reject('No text data found to produce videos from keyword: ' + object.keyword);
            }
            else {
              this.readTextCache(object.keyword).then(data => {
                objectStore = JSON.parse(data);
                if (objectStore.length) {
                  if (searchParams.amazon) {
                    objectStore = objectStore.filter(el => el.amazon);
                  }
                  else {
                    objectStore = objectStore.filter(el => !el.amazon);
                  }
                  if (objectStore.length) {
                    objectStore = shuffle(objectStore);
                    let obj = null;
                    if (!searchParams.amazon) {
                      obj = objectStore[index];
                    }
                    else {
                      if (imageParams.template.includes('imageOnly') || imageParams.template.includes('imageTitle')) {
                        searchParams.imageKeywords = this.amazonKeywords(objectStore);
                      }
                    }
                    this.video(object.keyword,obj,searchParams,imageParams,true).then(video => {
                      if (!searchParams.multipleOnly || (searchParams.multipleOnly && video.count > 1)) {
                        dataStore.push(video);
                      }
                      index++;
                      this.videosFromFile(filePath,dataStore,index).then(data => resolve(data)).catch(err => reject(err));
                    }).catch(err => {
                      if (this.debug) console.log(err);
                      index++;
                      this.videosFromFile(filePath,dataStore,index).then(data => resolve(data)).catch(err => reject(err));
                    });
                  }
                  else {
                    reject('No data found in cache for video keyword: ' + object.keyword);
                  }
                }
                else {
                  reject('No data found in cache for video keyword: ' + object.keyword);
                }
              }).catch(err => reject(err));
            }
          }
          else {
            let obj = null;
            this.video(object.keyword,obj,searchParams,imageParams,true).then(video => {
              if (!searchParams.multipleOnly || (searchParams.multipleOnly && video.count > 1)) {
                dataStore.push(video);
              }
              index++;
              this.videosFromFile(filePath,dataStore,index).then(data => resolve(data)).catch(err => reject(err));
            }).catch(err => {
              if (this.debug) console.log(err);
              index++;
              this.videosFromFile(filePath,dataStore,index).then(data => resolve(data)).catch(err => reject(err));
            });
          }
        }
        else if (dataStore.length) {
          fs.writeFile(searchParams.assets + searchParams.clips,JSON.stringify(dataStore),err => {
            if (err) {
              reject(err);
            }
            else {
              fcp.init(searchParams.assets,searchParams.images,searchParams.voice);
              fcp.xml(dataStore,searchParams.project);
              fcp.write();
              resolve('Video XML successfully saved to: ' + searchParams.assets);
            }
          });
        }
        else {
          reject('No videos produced from selected file path: ' + filePath);
        }
      }
    });
  },

  addImages: function(keywords,imageArgs,searchAll,index) {
    return new Promise((resolve,reject) => {
      if (!keywords || typeof keywords !== 'object') {
        reject('Unable to download images without image keyword list.');
      }
      else {
        if (imageArgs === undefined) imageArgs = null;
        if (searchAll === undefined) searchAll = true;
        if (!index) index = 0;
        if (keywords.length) {
          let googleParams = this.setImageParams(imageArgs);
          googleParams.search = 'google';
          this.images(keywords[0],googleParams).then(() => {
            if (searchAll) {
              let flickrParams = this.setImageParams(imageArgs);
              flickrParams.search = 'flickr';
              this.images(keywords[0],flickrParams).then(() => {
                index++;
                keywords.shift();
                this.addImages(keywords,imageArgs,searchAll,index).then(data => resolve(data)).catch(err => reject(err));
              }).catch(err => {
                if (this.debug) console.log(err);
                index++;
                keywords.shift();
                this.addImages(keywords,imageArgs,searchAll,index).then(data => resolve(data)).catch(err => reject(err));
              });
            }
            else {
              index++;
              keywords.shift();
              this.addImages(keywords,imageArgs,searchAll,index).then(data => resolve(data)).catch(err => reject(err));
            }
          }).catch(err => {
            if (this.debug) console.log(err);
            keywords.shift();
            this.addImages(keywords,imageArgs,searchAll,index).then(data => resolve(data)).catch(err => reject(err));
          });
        }
        else if (index) {
          resolve(`Downloaded ${index} keyword(s) from image keyword list.`);
        }
        else {
          reject('No images downloaded from keyword list.');
        }
      }
    });
  },

  deleteImages: function(images,property,index) {
    return new Promise((resolve,reject) => {
      if (!images || typeof images !== 'object' || !property || typeof property !== 'string') {
        reject('Unable to delete images without image object properties.');
      }
      else {
        if (!index) index = 0;
        if (images.length && images[0].keyword && images[0].value) {
          this.deleteImageCache(images[0].keyword,property,images[0].value).then(msg => {
            if (this.debug) console.log(msg);
            images.shift();
            index++;
            this.deleteImages(images,property,index).then(data => resolve(data)).catch(err => reject(err));
          }).catch(err => {
            if (this.debug) console.log(err);
            images.shift();
            this.deleteImages(images,property,index).then(data => resolve(data)).catch(err => reject(err));
          })
        }
        else if (index) {
          resolve(`Deleted ${index} images(s) from image list.`);
        }
        else {
          reject('No images deleted from image list.');
        }
      }
    });
  },

  pagesFromFile: function(filePath,index) {
    return new Promise((resolve,reject) => {
      if (!filePath || typeof filePath !== 'string') {
        reject('Unable to create videos without file path.');
      }
      else {
        let data = require(filePath);
        if (!index) index = 0;
        let object = data.objects[index];
        let searchParams, imageParams;
        if (object) {
          searchParams = this.overrideSearchParams(data.search,object.search);
          imageParams = this.overrideImageParams(data.image,object.image);
        }
        else {
          searchParams = this.overrideSearchParams(data.search,null);
          imageParams = this.overrideImageParams(data.image,null);
        }
        if (index < data.objects.length) {
          if (searchParams.amazon) {
            this.amazonPages(object.keyword,searchParams).then(msg => {
              if (this.debug) console.log(msg);
              index++;
              this.pagesFromFile(filePath,index).then(data => resolve(data)).catch(err => reject(err));
            }).catch(err => {
              if (this.debug) console.log(err);
              index++;
              this.pagesFromFile(filePath,index).then(data => resolve(data)).catch(err => reject(err));
            });
          }
          else {
            this.pages(object.keyword,searchParams).then(msg => {
              if (this.debug) console.log(msg);
              index++;
              this.pagesFromFile(filePath,index).then(data => resolve(data)).catch(err => reject(err));
            }).catch(err => {
              if (this.debug) console.log(err);
              index++;
              this.pagesFromFile(filePath,index).then(data => resolve(data)).catch(err => reject(err));
            });
          }
        }
        else {
          resolve(`Finished downloading ${index} keywords from file: ${filePath}`);
        }
      }
    });
  },

  upload: function(metadata,apiParams) {
    fcp.upload(metadata,apiParams);
  }

};

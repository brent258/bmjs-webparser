const request = require('request-promise');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const rand = require('bmjs-random');
const pos = require('bmjs-engpos');

module.exports = {

  assetsPath: '',
  cachePath: '',
  downloadedImageMetadata: [],
  downloadedImageLinks: [],
  paragraphTags: ['p','div'],
  embeddedTags: ['a','span','em','strong','code','b'],
  headerTags: ['h1','h2','h3','h4','h5','h6'],
  listTags: ['ul','ol','li'],
  punctuationMarks: ['.','!','?',':','"'],
  paused: false,
  proxies: [],
  lastGoogleProxy: '',
  lastBingProxy: '',
  lastFlickrProxy: '',
  lastWebSearch: '',
  imageBlacklist: [],
  textBlacklist: [],
  imageQueueData: [],
  textQueueData: [],
  imageQueueList: [],
  textQueueList: [],

  pause: function() {
    this.paused = true;
  },

  unpause: function() {
    this.paused = false;
  },

  init: function() {
    this.downloadedImageLinks = [];
    this.downloadedImageMetadata = [];
    this.setAssetsPath();
    this.setCachePath();
  },

  addImageBlacklist: function(item) {

  },

  addTextBlacklist: function(item) {

  },

  checkImageBlacklist: function(item) {

  },

  checkTextBlacklist: function(item) {

  },

  addProxy: function(proxy) {

  },

  googleProxy: function() {

  },

  bingProxy: function() {

  },

  flickrProxy: function() {

  },

  addTextQueue: function(keyword,data) {

  },

  addImageQueue: function(keyword,data) {

  },

  updateTextQueue: function(keyword) {
    return new Promise((resolve,reject) => {
      if (!obj) {
        reject();
      }
      else {

      }
    });
  },

  updateImageQueue: function(keyword) {
    return new Promise((resolve,reject) => {
      if (!obj) {
        reject();
      }
      else {

      }
    });
  },

  createTextCache: function(keyword) {
    return new Promise((resolve,reject) => {
      if (!obj) {
        reject();
      }
      else {

      }
    });
  },

  readTextCache: function(keyword) {
    return new Promise((resolve,reject) => {
      if (!obj) {
        reject();
      }
      else {

      }
    });
  },

  updateTextCache: function(obj,keyword) {
    return new Promise((resolve,reject) => {
      if (!obj) {
        reject();
      }
      else {

      }
    });
  },

  updateTextCacheMultiple: function(obj,keyword,limit,index) {
    return new Promise((resolve,reject) => {
      if (!obj) {
        reject();
      }
      else {

      }
    });
  },

  createImageCache: function(keyword) {
    return new Promise((resolve,reject) => {
      if (!obj) {
        reject();
      }
      else {

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
          reject();
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

  updateImageCache: function(obj,keyword) {
    return new Promise((resolve,reject) => {
      if (!obj) {
        reject();
      }
      else {

      }
    });
  },

  updateImageCacheMultiple: function(obj,keyword,limit,index) {
    return new Promise((resolve,reject) => {
      if (!obj) {
        reject();
      }
      else {

      }
    });
  },

  setAssetsPath: function(dir) {
    if (!dir || typeof dir !== 'string') {
      this.assetsPath = 'assets';
    }
    else {
      this.assetsPath = dir;
    }
  },

  createAssets: function() {
    if (!this.assetsPath) this.setAssetsPath();
    if (!fs.existsSync(this.assetsPath)) {
      console.log('Assets directory not found. Creating folder...');
      fs.mkdir(this.assetsPath,err => {
        if (err) console.log(err.message);
        console.log('Finished creating assets directory.');
      });
    }
    else {
      console.log('Assets directory already exists.');
    }
  },

  setCachePath: function(dir) {
    if (!dir || typeof dir !== 'string') {
      this.cachePath = 'cache';
    }
    else {
      this.cachePath = dir;
    }
  },

  createCache: function() {
    if (!this.cachePath) this.setCachePath();
    if (!fs.existsSync(this.cachePath)) {
      console.log('Cache directory not found. Creating folder...');
      fs.mkdir(this.cachePath,err => {
        if (err) console.log(err.message);
        console.log('Finished creating cache directory.');
      });
    }
    else {
      console.log('Cache directory already exists.');
    }
    if (!fs.existsSync(this.cachePath + '/data')) {
      console.log('Data cache directory not found. Creating folder...');
      fs.mkdir(this.cachePath + '/data',err => {
        if (err) console.log(err.message);
        console.log('Finished creating data cache directory.');
      });
    }
    else {
      console.log('Data cache directory already exists.');
    }
    if (!fs.existsSync(this.cachePath + '/images')) {
      console.log('Image cache directory not found. Creating folder...');
      fs.mkdir(this.cachePath + '/images',err => {
        if (err) console.log(err.message);
        console.log('Finished creating image cache directory.');
      });
    }
    else {
      console.log('Image cache directory already exists.');
    }
    if (!fs.existsSync(this.cachePath + '/data/text')) {
      console.log('Text data cache directory not found. Creating folder...');
      fs.mkdir(this.cachePath + '/data/text',err => {
        if (err) console.log(err.message);
        console.log('Finished creating text data cache directory.');
      });
    }
    else {
      console.log('Text data cache directory already exists.');
    }
    if (!fs.existsSync(this.cachePath + '/data/images')) {
      console.log('Image data cache directory not found. Creating folder...');
      fs.mkdir(this.cachePath + '/data/images',err => {
        if (err) console.log(err.message);
        console.log('Finished creating image data cache directory.');
      });
    }
    else {
      console.log('Image data cache directory already exists.');
    }
  },

  objectInArray: function(obj,arr,ignoreKeys) {
    if (!obj || !arr || typeof obj !== 'object' || typeof arr !== 'object' || !arr[0]) {
      return false;
    }
    let keys = Object.keys(obj);
    if (!keys.length) return false;
    for (let i = 0; i < arr.length; i++) {
      let matches = true;
      for (let j = 0; j < keys.length; j++) {
        if (!arr[i][keys[j]] || arr[i][keys[j]] !== obj[keys[j]]) {
          matches = false;
          break;
        }
        if (matches) return true;
      }
    }
    return false;
  },

  calculateImageCrop: function(width,height) {

  },

  downloadImage: function(obj,savePath,scaleToFill) {
    return new Promise((resolve,reject) => {
      if (!obj) {
        reject();
      }
      else {

      }
    });
  },

  googleImage: function(keyword,imageParams,domain) {
    return new Promise((resolve,reject) => {
      if (!keyword) {
        reject('Unable to search for images without keyword.');
      }
      else {
        if (!imageParams) imageParams = {};
        if (!imageParams.options) imageParams.options = ['large','commercial'];
        if (!imageParams.tags) imageParams.tags = [];
        if (imageParams.crop === undefined) imageParams.crop = true;
        if (imageParams.exact === undefined) imageParams.exact = true;
        if (!domain) domain = 'com.au';
        let parsedKeyword = keyword.replace(/[^a-zA-Z\s]/g,'').replace(/\s+/g,'+');
        let url = `https://www.google.${domain}/search?q=${parsedKeyword}&tbm=isch`;
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
              if (!color) color = '&color_codes=2';
              break;
              case 'lightpink':
              if (!color) color = '&color_codes=b';
              break;
              case 'yellow':
              if (!color) color = '&color_codes=4';
              break;
              case 'lightorange':
              if (!color) color = '&color_codes=3';
              break;
              case 'lightgreen':
              if (!color) color = '&color_codes=5';
              break;
              case 'green':
              if (!color) color = '&color_codes=6';
              break;
              case 'lightblue':
              if (!color) color = '&color_codes=7';
              break;
              case 'blue':
              if (!color) color = '&color_codes=8';
              break;
              case 'purple':
              if (!color) color = '&color_codes=9';
              break;
              case 'pink':
              if (!color) color = '&color_codes=a';
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
        let proxy = this.googleProxy();
        if (proxy) {
          options.proxy = proxy;
        }
        else {
          console.log('WARNING: Proxies currently not set.');
        }
        request(options).then(html => {
          html = html.replace(/(\s*\n+\s*|\s*\r+\s*)/g,'');
          let $ = cheerio.load(html);
          let photos = [];
          $('.rg_meta.notranslate').each(function(i,el) {
            if ($(this).text()) {
              photos.push(JSON.parse($(this).text()));
            }
          });
          let data = [];
          for (let i = 0; i < photos.length; i++) {
            let obj = {
              title: photos[i].pt,
              author: photos[i].isu,
              url: photos[i].ru,
              image: photos[i].ou,
              width: parseInt(photos[i].ow),
              height: parseInt(photos[i].oh),
              filename: path.basename(photos[i].ou.split('?')[0])
            };
            if (this.findKeywordInSentence(keyword,obj.title)) {
              data.push(obj);
            }
          }
          if (!data.length) {
            reject(`Unable to find Google images on page ${page} for keyword: ${keyword}`);
          }
          else {
            resolve(data);
          }
        }).catch(err => reject(err));
      }
    });
  },

  flickrImage: function(keyword,imageParams,page) {
    return new Promise((resolve,reject) => {
      if (!keyword) {
        reject('Unable to search for images without keyword.');
      }
      else {
        if (!imageParams) imageParams = {};
        if (!imageParams.options) imageParams.options = ['large','commercial'];
        if (!imageParams.tags) imageParams.tags = [];
        if (imageParams.crop === undefined) imageParams.crop = true;
        if (imageParams.exact === undefined) imageParams.exact = true;
        if (!page) page = 1;
        let parsedKeyword = keyword.replace(/[^a-zA-Z\s]/g,'').replace(/\s+/g,'%20');
        let url = `https://www.flickr.com/search/?text=${parsedKeyword}&page=${page}`;
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
              if (!color) color = '&color_codes=2';
              break;
              case 'lightpink':
              if (!color) color = '&color_codes=b';
              break;
              case 'yellow':
              if (!color) color = '&color_codes=4';
              break;
              case 'lightorange':
              if (!color) color = '&color_codes=3';
              break;
              case 'lightgreen':
              if (!color) color = '&color_codes=5';
              break;
              case 'green':
              if (!color) color = '&color_codes=6';
              break;
              case 'lightblue':
              if (!color) color = '&color_codes=7';
              break;
              case 'blue':
              if (!color) color = '&color_codes=8';
              break;
              case 'purple':
              if (!color) color = '&color_codes=9';
              break;
              case 'pink':
              if (!color) color = '&color_codes=a';
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
          console.log('WARNING: Proxies currently not set.');
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
              author: photos[i].realname || photos[i].username || photos[i].ownerNsid,
              url: 'https://www.flickr.com/photos/' + photos[i].pathAlias + '/' + photos[i].id,
              image: 'https:' + photos[i].sizes[size].url,
              width: parseInt(photos[i].sizes[size].width),
              height: parseInt(photos[i].sizes[size].height),
              filename: path.basename(photos[i].sizes[size].url.split('?')[0])
            };
            if (this.findKeywordInSentence(keyword,obj.title)) {
              data.push(obj);
            }
          }
          if (!data.length) {
            reject(`Unable to find Flickr images on page ${page} for keyword: ${keyword}`);
          }
          else {
            resolve(data);
          }
        }).catch(err => reject(err));
      }
    });
  },

  flickrImageLoop: function(keyword,imageParams,page,store) {
    return new Promise((resolve,reject) => {
      if (!keyword) {
        reject('Unable to search for images without keyword.');
      }
      else {
        if (!imageParams) imageParams = {};
        if (!imageParams.options) imageParams.options = ['large','commercial'];
        if (!imageParams.tags) imageParams.tags = [];
        if (imageParams.crop === undefined) imageParams.crop = true;
        if (imageParams.exact === undefined) imageParams.exact = true;
        if (!page) page = 1;
        if (!store) store = [];
        this.flickrImage(keyword,imageParams,page).then(data => {
          store = store.concat(data);
          page++;
          console.log(`Searching for Flickr images on page ${page} for keyword: ${keyword}`);
          this.flickrImageLoop(keyword,imageParams,page,store).then(data => resolve(data)).catch(err => reject(err));
        }).catch(err => {
          if (store.length) {
            console.log(err);
            resolve(store);
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
      if (!keyword) {
        reject('Unable to search for images without keyword.');
      }
      else {
        if (!imageParams) imageParams = {};
        if (!imageParams.search) imageParams.search = 'google';
        if (!imageParams.options) imageParams.options = ['large','commercial'];
        if (!imageParams.tags) imageParams.tags = [];
        if (imageParams.crop === undefined) imageParams.crop = true;
        if (imageParams.cacheOnly === undefined) imageParams.cacheOnly = true;
        if (imageParams.exact === undefined) imageParams.exact = true;
        if (!imageParams.limit) imageParams.limit = 3;
        let self = this;
        let callback = function(data) {
          self.updateImageCacheMultiple(data,keyword,imageParams.crop,imageParams.limit).then(data => {
            self.readImageCache(keyword).then(data => {
              let images = shuffle(JSON.parse(data));
              let filtered = [];
              for (let i = 0; i < imageParams.limit; i++) {
                if (images[i]) filtered.push(images[i]);
              }
              resolve(filtered);
            }).catch(err => reject(err));
          }).catch(err => reject(err));
        };
        if (imageParams.cacheOnly) {
          this.readImageCache(keyword).then(data => {
            let images = shuffle(JSON.parse(data));
            let filtered = [];
            for (let i = 0; i < imageParams.limit; i++) {
              if (images[i]) filtered.push(images[i]);
            }
            resolve(filtered);
          }).catch(err => {
            console.log(err);
            console.log('No images found. Searching for new images...');
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

  selectImageWithKeyword: function(keyword,data) {

  },

  selectImageWithTags: function(keyword,data,tags) {

  },

  getSearchLinks: function(html,searchSource) {
    if (this.paused) return;
    let results = [];
    let $ = cheerio.load(html);
    let links = $('a').get();
    if (links.length > 0) {
      for (let i = 0; i < links.length; i++) {
        if (links[i].attribs.href) {
          links[i].attribs.href = links[i].attribs.href.replace(/http:\/\/webcache\.googleusercontent\.com.*:http/g,'http');
          let searchDomain = links[i].attribs.href.match(/(http:\/\/|https:\/\/)[a-z0-9\-\.]+\//g);
          if (!searchDomain || (results.length > 0 && results[results.length-1].includes(searchDomain))) {
            continue;
          }
          if (links[i].attribs.href.match(/\/url\?q\=/)) {
            let parsedLink = links[i].attribs.href.replace(/\/url\?q\=/g,'').split('&')[0];
            if (!results.includes(parsedLink)) {
              results.push(parsedLink);
            }
          }
          else if (searchSource === 'bing' && links[i].attribs.href.match(/(http:\/\/|https:\/\/)/) && !links[i].attribs.href.match(/(\.microsoft\.|\.bing\.)/)) {
            if (!results.includes(links[i].attribs.href)) {
              results.push(links[i].attribs.href);
            }
          }
        }
      }
    }
    return results;
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
    .replace(/^(\n|\s|\r|\t)*/g,'')
    .replace(/(\n|\s|\r|\t)*$/g,'')
    .replace(/(\n|\r|\t|\s+)/g,' ')
    .replace(/^[^A-Za-z]*([A-Za-z])/,'$1')
    .replace(/([a-zA-Z])(\:\s.+|\s\(.+|\s\-\s.+|\s\|\s.+|\,\s.+)/,'$1')
    .replace(/[\.\?\!]$/,'');
    if (text) return pos.titlecase(text);
    return '';
  },

  parseText: function(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    text = text
    .replace(/^(\n|\s|\r|\t)*/g,'')
    .replace(/(\n|\s|\r|\t)*$/g,'')
    .replace(/(\n|\r|\t|\s+)/g,' ')
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
    .replace(/([\!\?\.])\s*(\w)/g,'$1|||||$2');
    if (!text.match(/\s[A-Z]/) && text.match(/\b(his|her)\s[a-z]/)) text = text.replace(/\b(his|her)\b/g,'their');
    if (!text.match(/\s[A-Z]/) && text.match(/\b(him|her[^\s])\b/)) text = text.replace(/\b(him|her)\b/g,'them');
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
    if (sentence.match(/\b(we|i|our|ourselves|ourself|my|us|me|myself|he|his|him|himself|she|her|hers|herself)\b/i)) return false;
    if (sentence.match(/(\d\:\d|19\d\d|20\d\d)/)) return false;
    if (sentence.match(/\b(today|tomorrow|yesterday|last\sweek|last\smonth|last\syear|next\sweek|next\smonth|next\syear|this\sweek|this\smonth|this\syear)\b/i)) return false;
    if (sentence.match(/\b(January|February|March|April|May|June|July|August|September|November|December)\b/)) return false;
    if (sentence.match(/\b(error|problem|issue|trouble|unable)/i) && sentence.match(/\b(server|request|response|page|web|gateway|data|loading|load|open|opening)\b/i)) return false;
    if (sentence.match(/\b(please|thanks|thankyou|thank\syou|hello|hi|hey|greetings|welcome|goodbye|bye)\b/i)) return false;
    if (sentence.match(/(shit|fuck|dick|piss|cunt|bitch|bastard)/i)) return false;
    if (sentence.match(/\b(posts|articles|comments|videos|related|reviews|answers|questions|replies|products|pages|items|similar|popular|category|categories|ratings|responses)\b/)) return false;
    if (sentence.match(/\b(post|write|leave|make|send|reply|respond)\b/i) && sentence.match(/\b(comment|reply|message|email|article|post|review)\b/i)) return false;
    if (sentence.match(/\b(subscribe|join|sign\sup|signup|become)\b/i) && sentence.match(/\b(free|newsletter|updates|news|email|membership|course|program|subscriber|member)\b/i)) return false;
    return true;
  },

  validateLink: function(sentence,url) {
    if (!sentence || !url || typeof sentence !== 'string' || typeof url !== 'string') {
      return false;
    }
    if (!this.validateHeader(sentence,url)) return false;
    if (sentence.match(/\b(next|previous|more|continue|join|member|post|reply|view|click|view|watch|see|request|respond|edit|save|add|open|review|checkout|check\sout|subscribe|sign\sup|signup|read|learn|comment|publish|feedback|newsletter|update|upload|buy|shipping|offer|cart)/i)) return false;
    return true;
  },

  validateText: function(sentence,url) {
    if (!sentence || !url || typeof sentence !== 'string' || typeof url !== 'string') {
      return false;
    }
    if (sentence.match(/[a-z][A-Z]/)) return false;
    if (sentence.match(/[\.\,\?\!\;\&\/][\.\,\?\!\;\&\/]/)) return false;
    if (!sentence.match(/[\!\.\?]$/)) return false;
    if (!sentence.match(/^[A-Z\"]/)) return false;
    if (!sentence.match(/\s[a-z]/)) return false;
    if (sentence.match(/[\%\$]/)) return false;
    if (this.matchUrl(sentence,url)) return false;
    if (sentence.match(/\b(we|i|our|ourselves|ourself|my|us|me|myself|he|his|him|himself|she|her|hers|herself)\b/i)) return false;
    if (sentence.match(/(\d\:\d|19\d\d|20\d\d)/)) return false;
    if (sentence.match(/\b(today|tomorrow|yesterday|last\sweek|last\smonth|last\syear|next\sweek|next\smonth|next\syear|this\sweek|this\smonth|this\syear)\b/i)) return false;
    if (sentence.match(/\b(January|February|March|April|May|June|July|August|September|November|December)\b/)) return false;
    if (sentence.match(/\b(error|problem|issue|trouble|unable)/i) && sentence.match(/\b(server|request|response|page|web|gateway|data|loading|load|open|opening)\b/i)) return false;
    if (sentence.match(/\b(please|thanks|thankyou|thank\syou|hello|hi|hey|greetings|welcome|goodbye|bye)\b/i)) return false;
    if (sentence.match(/(shit|fuck|dick|piss|cunt|bitch|bastard)/i)) return false;
    return true;
  },

  findKeywordInSentence: function(keyword,sentence) {
    if (!keyword || typeof keyword !== 'string' || !sentence || typeof sentence !== 'string') {
      return false;
    }
    if (sentence.includes(keyword)) return true;
    let matches = 0;
    let lowercasedKeyword = keyword.replace(/[^\w]/gi,' ').replace(/\s+/g,' ').trim().toLowerCase().split(' ');
    for (let i = 0; i < lowercasedKeyword.length; i++) {
      if (sentence.includes(lowercasedKeyword[i])) matches++;
      if (matches > 1) return true;
    }
    let uppercasedKeyword = pos.titlecase(keyword.replace(/[^\w]/gi,' ').replace(/\s+/g,' ').trim()).split(' ');
    for (let i = 0; i < uppercasedKeyword.length; i++) {
      if (sentence.includes(uppercasedKeyword[i])) matches++;
      if (matches > 1) return true;
    }
    return false;
  },

  findContextFromUrl: function(template,url) {
    if (!template || typeof template !== 'string' || !url || typeof url !== 'string') {
      return false;
    }
    let regex;
    let parsedUrl = url.replace(/(http|https)(\:\/\/)(www\.)*([a-z\-]+)([.])+/,'$5').replace(/[^a-z][^a-z]*/gi,'-');
    switch (template) {
      case 'tips':
      regex = /\b(tips|how.to|ideas)\b/i;
      if (parsedUrl.match(regex)) return true;
      return false;
      case 'facts':
      regex = /\b(facts|info|information)\b/i;
      if (parsedUrl.match(regex)) return true;
      case 'myths':
      regex = /\b(myths|misconceptions)\b/i;
      if (parsedUrl.match(regex)) return true;
      case 'list':
      regex = /\b(best|top|\d.\w)\b/i;
      if (parsedUrl.match(regex)) return true;
      return false;
      case 'product':
      regex = /\b(\d\d)\b/i;
      if (parsedUrl.match(regex)) return true;
      return false;
      case 'review':
      regex = /\b(review)\b/i;
      if (parsedUrl.match(regex)) return true;
      return false;
      default: return false;
    }
  },

  filterBodyContent: function(paragraph,url) {
    if (!paragraph || !url || typeof paragraph !== 'string' || typeof url !== 'string') {
      return [];
    }
    if (!pos.validateSentence(paragraph)) return [];
    let splitParagraph = paragraph.split('|||||');
    let filtered = [];
    for (let i = 0; i < splitParagraph.length; i++) {
      if (this.validateText(splitParagraph[i],url)) filtered.push(splitParagraph[i]);
    }
    if (filtered.length) return filtered;
    return [];
  },

  firstParagraph: function(obj) {
    if (!obj || typeof obj !== 'object') {
      return;
    }
    let data = obj.body.content;
    for (let i = 0; i < data.length; i++) {
      if (data[i].header && this.findKeywordInSentence(data[i].header,data[i].text.join(''))) return {text: data[i].text, header: data[i].header};
      if (data[i].text.join('').length > 100) return {text: data[i].text, header: obj.body.title};
    }
  },

  randomParagraph: function(obj,maxTries) {
    if (!obj || typeof obj !== 'object') {
      return;
    }
    let maxCount = Math.abs(Object.keys(obj.body.content).length-1);
    let startCount = Math.floor(Math.random() * maxCount) + 1;
    let data = obj.body.content;
    for (let i = startCount; i < data.length; i++) {
      if (data[i].header && this.findKeywordInSentence(data[i].header,data[i].text.join(''))) return {text: data[i].text, header: data[i].header};
      if (data[i].text.join('').length > 100) return {text: data[i].text, header: obj.body.title};
    }
    if (maxTries && typeof maxTries === 'number') {
      maxTries--;
      this.randomParagraph(obj,maxTries);
    }
  },

  extractBodyContent: function($,url,filterText) {
    let store = [];
    let obj = {content: [], headers: [], links: []};
    let lastHeader = '';
    let lastLink = '';
    let self = this;
    let title = $('h1').first().text() || $('h2').first().text() || '';
    $('div').contents()
    .each(function(i,el) {
      let content;
      if (el.name === 'p') {
        if ($(this).children().length) {
          $(this).children().each(function(j,subEl) {
            if (subEl.name === 'h1' || subEl.name === 'h2' || subEl.name === 'h3' || subEl.name === 'h4' || subEl.name === 'b' || subEl.name === 'strong') {
              content = self.parseHeader($(this).text());
              if (!store.includes(content) && self.validateHeader(content,url)) {
                store.push(content);
                lastHeader = content;
                obj.headers.push(content);
              }
            }
          });
        }
        content = $(this).text();
        if (lastHeader && content && content.indexOf(lastHeader) === 0) {
          let index = lastHeader.length;
          content = content.slice(0,index);
        }
        content = self.parseText(content);
        if (!store.includes(content)) {
          store.push(content);
          if (content.match(/^[A-Z].+[\.\?\!]$/)) obj.content.push({text: content, header: lastHeader, link: lastLink});
        }
      }
      else if (el.name === 'h1' || el.name === 'h2' || el.name === 'h3' || el.name === 'h4' || el.name === 'b' || el.name === 'strong') {
        content = self.parseHeader($(this).text());
        if (!store.includes(content) && self.validateHeader(content,url)) {
          store.push(content);
          lastHeader = content;
          obj.headers.push(content);
        }
      }
      else if (el.name === 'ul' || el.name === 'ol') {
        let list = [];
        $(this).children().each(function(j,subEl) {
          if (subEl.name === 'li' && !$(this).children().length) {
            content = self.parseText($(this).text());
            if (!store.includes(content)) {
              store.push(content);
              obj.content.push({text: content, header: lastHeader, link: lastLink});
              if (content && !content.match(/[\!\?\.]$/)) content += '.';
              if (content.match(/^[A-Z].+[\.\?\!]$/)) list.push(content);
            }
          }
        });
        if (list.length) obj.content.push({text: list.join(' '), header: lastHeader, link: lastLink});
      }
      else if (el.type === 'text') {
        if ($(this).parent().children().length) {
          $(this).parent().children().each(function(j,subEl) {
            if (subEl.name === 'h1' || subEl.name === 'h2' || subEl.name === 'h3' || subEl.name === 'h4' || subEl.name === 'b' || subEl.name === 'strong') {
              content = self.parseHeader($(this).text());
              if (!store.includes(content) && self.validateHeader(content,url)) {
                store.push(content);
                lastHeader = content;
                obj.headers.push(content);
              }
            }
            else if (subEl.name === 'ul' || subEl.name === 'ol') {
              let list = [];
              $(this).children().each(function(k,subSubEl) {
                if (subSubEl.name === 'li') {
                  content = self.parseText($(this).text());
                  if (!store.includes(content)) {
                    store.push(content);
                    obj.content.push({text: content, header: lastHeader, link: lastLink});
                    if (content && !content.match(/[\!\?\.]$/)) content += '.';
                    if (content.match(/^[A-Z].+[\.\?\!]$/)) list.push(content);
                  }
                }
              });
              if (list.length) obj.content.push({text: list.join(' '), header: lastHeader, link: lastLink});
            }
          });
        }
        for (let count = 0; count < el.parent.children.length; count++) {
          if (el.parent.children[count].type === 'text') {
            content = self.parseText(el.parent.children[count].data);
            if (!store.includes(content)) {
              store.push(content);
              if (content.match(/^[A-Z].+[\.\?\!]$/)) obj.content.push({text: content, header: lastHeader, link: lastLink});
            }
          }
        }
      }
      else if (el.tagName === 'a') {
        content = self.parseHeader($(this).text());
        link = $(this).attr('href') || '';
        if (!store.includes(content) && self.validateLink(content,url)) {
          store.push(content);
          lastLink = content;
          obj.links.push({text: content, url: link});
        }
      }
    });
    let filteredContent = [];
    for (let i = 0; i < obj.content.length; i++) {
      let filtered;
      if (filterText || typeof filterText === 'undefined') {
        filtered = this.filterBodyContent(obj.content[i].text,url);
      }
      else {
        filtered = obj.content[i].text.split('|||||');
      }
      if (filtered.length) {
        filteredContent.push({text: filtered, header: obj.content[i].header, link: obj.content[i].link});
      }
    }
    obj.content = filteredContent;
    obj.title = this.parseHeader(title);
    return obj;
  },

  webpage: function(url,filterText) {
    if (this.paused) return;
    return new Promise((resolve,reject) => {
      let options = {
        method: 'GET',
        uri: url,
        gzip: true
      };
      request(options).then(html => {
        let $ = cheerio.load(html);
        let pageObject = {
          title: '',
          description: '',
          body: '',
          keywords: '',
        };
        pageObject.title = $('title').text() || '';
        pageObject.description = $('meta[name="description"]').attr('content') || '';
        pageObject.keywords = $('meta[name="keywords"]').attr('content') || '';
        pageObject.url = url;
        pageObject.body = this.extractBodyContent($,url,filterText);
        resolve(pageObject);
      }).catch(err => reject(err));
    });
  },

  resultLinks: function($,searchSource) {
    let links = [];
    if (searchSource === 'google') {
      $('h3 a').each(function(i,el) {
        if ($(this).attr('href').match(/(http:|https:)/)) {
          links.push($(this).attr('href'));
        }
      });
    }
    else if (searchSource === 'bing') {
      $('h2 a').each(function(i,el) {
        if ($(this).attr('href').match(/(http:|https:)/)) {
          links.push($(this).attr('href'));
        }
      });
    }
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
        if (!maxResult) maxResult = 1;
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
          console.log('WARNING: Proxies currently not set.');
        }
        request(options).then(html => {
          console.log('Searching Google for keyword: ' + keyword);
          let $ = cheerio.load(html);
          let results = this.resultLinks($,'google');
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
        if (!maxResult) maxResult = 1;
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
          console.log('WARNING: Proxies currently not set.');
        }
        request(options).then(html => {
          console.log('Searching Bing for keyword: ' + keyword);
          let $ = cheerio.load(html);
          let results = this.resultLinks($,'bing');
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
          this.bingSearch(keyword,minResult,maxResult,googleDomain).then(data => resolve(data)).catch(err => reject(err));
        }
      }
    });
  },

  resultsFromKeyword: function(keyword,searchSource,maxResults,searchDomain) {
    if (this.paused) return;
    if (!keyword || typeof keyword !== 'string') {
      console.log('Invalid keyword entered.');
      return;
    }
    let parsedKeyword = keyword.replace(/\s/g,'+');
    let hasInvalidChars = parsedKeyword.match(/[^0-9a-zA-Z+]/);
    if (hasInvalidChars) {
      console.log(`Invalid characters in entered keyword: ${keyword}. Must contain only words and spaces.`);
      return;
    }
    let searchUrl;
    if (!searchSource || searchSource === 'google') {
      searchUrl = `https://www.google.${searchDomain || 'com.au'}/search?q=${parsedKeyword}`;
    }
    else if (searchSource === 'bing') {
      searchUrl = `https://www.bing.com/search?q=${parsedKeyword}&cc=${searchDomain || 'au'}`;
    }
    return new Promise((resolve,reject) => {
        let options = {
          method: 'GET',
          uri: searchUrl,
          gzip: true
        };
        request(options).then(firstPageResults => {
          if (maxResults === 0 || maxResults === undefined) {
            let results = this.getSearchLinks(firstPageResults,searchSource);
            if (!results.length) reject('No results found for keyword: ' + keyword);
            resolve(results);
          }
          firstPageResults = firstPageResults.replace(/(\n|\r)/g,'');
          let resultCount;
          if (firstPageResults.match(/[0-9,]+\sresults/i)) {
            resultCount = parseInt(firstPageResults.match(/[0-9,]+\sresults/i)[0].replace(/(results|\s|,)/gi,''));
          }
          let randomPage = Math.floor(Math.random() * maxResults) + 1;
          let pageQuery;
          if (searchSource === 'bing') {
            pageQuery = '&first=' + (randomPage);
          }
          else {
            pageQuery = '&start=' + (randomPage - 10);
          }
          let options = {
            method: 'GET',
            uri: searchUrl+pageQuery,
            gzip: true
          };
          request(options).then(randomPageResults => {
            let results = this.getSearchLinks(randomPageResults,searchSource);
            resolve(results);
          }).catch(err => reject('Error accessing random results page for keyword: ' + keyword));
      }).catch(err => reject('Error accessing first results page for keyword: ' + keyword));
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

  videoProperties: function(obj,imageParams) {
    return new Promise((resolve,reject) => {
      if (!obj || !imageParams || !imageParams.fallback) {
        reject('Unable to create video properties without obj and fallback keyword.');
      }
      else {
        if (!imageParams.type) imageParams.type = 'intro';
        if (!imageParams.template) imageParams.template = '';
        if (!imageParams.search) imageParams.search = 'google';
        if (!imageParams.options) imageParams.options = ['large','commercial'];
        if (!imageParams.tags) imageParams.tags = [];
        if (imageParams.crop === undefined) imageParams.crop = true;
        if (imageParams.cacheOnly === undefined) imageParams.cacheOnly = true;
        if (imageParams.exact === undefined) imageParams.exact = true;
        if (!imageParams.limit) imageParams.limit = 3;
        let slides = [];
        let credits = [];
        let keyword = obj.match ? obj.header : imageParams.fallback;
        let description = imageParams === 'intro' ? pos.prettyPrint(obj.text.join(' '),true,true,false) : keyword + '\n\n' + pos.prettyPrintList(obj.text.join(' '),true,true,true);
        this.images(keyword,imageParams).then(data => {
          let imageActive = true;
          let textActive = true;
          if (imageParams.template === 'imageOnly') textActive = false;
          if (imageParams.template === 'textOnly') imageActive = false;
          let bothActive = imageActive && textActive ? true : false;
          let titleText, titleImage;
          if (bothActive) {
            titleImage = data[0] ? rand(data[0],null,null,null) : null;
            titleText = keyword;
          }
          else if (imageActive) {
            titleImage = data[0] ? data[0] : null;
            titleText = '';
          }
          else if (textActive) {
            titleImage = null;
            titleText = keyword;
          }
          let titleObj = {
            text: titleText,
            audio: '',
            image: titleImage,
            template: imageParams.template,
            keyword: keyword,
            url: obj.url
          };
          let titleCredit = this.imageCredit(data[0]);
          if (titleCredit) credits.push(titleCredit);
          if (titleObj.text || titleObj.image) slides.push(titleObj);
          for (let i = 0; i < obj.text.length; i++) {
            let slideText, slideImage;
            let snippet = pos.prettyPrintSnippet(obj.text[i],false,true,false);
            if (bothActive) {
              slideImage = data[i+1] ? rand(data[i+1],data[i+1],data[i+1],null) : null;
              slideText = !slideImage ? snippet : rand(snippet,'');
            }
            else if (imageActive) {
              slideImage = data[i+1] ? data[i+1] : null;
              slideText = '';
            }
            else if (textActive) {
              slideImage = null;
              slideText = snippet;
            }
            let slideObj = {
              text: slideText,
              audio: '',
              image: slideImage,
              template: imageParams.template,
              keyword: keyword,
              url: obj.url
            };
            let slideCredit = this.imageCredit(data[i+1]);
            if (slideCredit) credits.push(slideCredit);
            if (slideObj.text || slideObj.image) slides.push(slideObj);
          }
          if (slides.length) {
            resolve({slides: slides, credits: credits, description: description});
          }
          else {
            reject('No video properties found from: ' + obj.url);
          }
        }).catch(err => reject(err));
      }
    });
  },

  videoSlides: function(count,url,imageParams,objectStore,slideStore) {
    return new Promise((resolve,reject) => {
      if (!count || !url || !imageParams || !imageParams.fallback) {
        reject('Unable to create video slides without count, url and fallback keyword.');
      }
      else {
        if (!imageParams.type) imageParams.type = 'intro';
        if (!imageParams.template) imageParams.template = '';
        if (!imageParams.search) imageParams.search = 'google';
        if (!imageParams.options) imageParams.options = ['large','commercial'];
        if (!imageParams.tags) imageParams.tags = [];
        if (imageParams.crop === undefined) imageParams.crop = true;
        if (imageParams.cacheOnly === undefined) imageParams.cacheOnly = true;
        if (imageParams.exact === undefined) imageParams.exact = true;
        if (!imageParams.limit) imageParams.limit = 3;
        if (!objectStore) objectStore = null;
        if (!slideStore) slideStore = {
          slides: [],
          description: [],
          credits: []
        };
        if (imageParams.type === 'intro') {
          this.website(url).then(data => {
            this.videoProperties(data,imageParams).then(data => {
              slideStore.slides = slideStore.slides.concat(data.slides);
              slideStore.credits = slideStore.credits.concat(data.credits);
              slideStore.description = data.description;
              resolve(slideStore);
            }).catch(err => reject(err));
          }).catch(err => reject(err));
        }
        else if (imageParams.type === 'random') {
          if (!slideStore.slides.length) {
            this.website(url).then(data => {
              objectStore = data;
              this.videoProperties(objectStore[0],imageParams).then(data => {
                slideStore.slides = slideStore.slides.concat(data.slides);
                slideStore.credits = slideStore.credits.concat(data.credits);
                slideStore.description.push(data.description);
                objectStore.shift();
                this.videoSlides(count,url,imageParams,objectStore,slideStore).then(data => resoleve(data)).catch(err => reject(err));
              }).catch(err => reject(err));
            }).catch(err => reject(err));
          }
          else if (objectStore.length) {
            this.videoProperties(objectStore[0],imageParams).then(data => {
              slideStore.slides = slideStore.slides.concat(data.slides);
              slideStore.credits = slideStore.credits.concat(data.credits);
              slideStore.description.push(data.description);
              objectStore.shift();
              this.videoSlides(count,url,imageParams,objectStore,slideStore).then(data => resoleve(data)).catch(err => reject(err));
            }).catch(err => reject(err));
          }
          else {
            slideStore.description = slideStore.description.join('\n');
            resolve(slideStore);
          }
        }
        else {
          reject('Invalid type argument.');
        }
      }
    });
  },

  video: function(keyword,searchParams,imageParams,errorHandler,sectionCountStore,dataStore,urlStore,slideStore,index) {
    return new Promise((resolve,reject) => {
      if (!keyword) {
        reject('Unable to create video without keyword.');
      }
      else {
        if (!searchParams) searchParams = {};
        if (!searchParams.minResult) searchParams.minResult = 1;
        if (!searchParams.maxResult) searchParams.maxResult = 1;
        if (!searchParams.minSections) searchParams.minSections = 5;
        if (!searchParams.maxSections) searchParams.maxSections = 10;
        if (!searchParams.maxTries) searchParams.maxTries = 10;
        if (!searchParams.template) searchParams.template = 'tips';
        if (!searchParams.count) searchParams.count = 1;
        if (!searchParams.category) searchParams.category = 0;
        if (!searchParams.privacy) searchParams.category = 'Public';
        if (searchParams.exact === undefined) searchParams.exact = true;
        if (!imageParams) imageParams = {};
        if (!imageParams.fallback) imageParams.fallback = keyword;
        if (!imageParams.type) imageParams.type = 'random';
        if (!imageParams.template) imageParams.template = '';
        if (!imageParams.search) imageParams.search = 'google';
        if (!imageParams.options) imageParams.options = ['large','commercial'];
        if (!imageParams.tags) imageParams.tags = [];
        if (imageParams.crop === undefined) imageParams.crop = true;
        if (imageParams.cacheOnly === undefined) imageParams.cacheOnly = true;
        if (imageParams.exact === undefined) imageParams.exact = true;
        if (!imageParams.limit) imageParams.limit = 3;
        if (!errorHandler) errorHandler = function(err) {
          if (searchParams.maxTries > 0) {
            searchParams.maxTries--;
            console.log(err);
            console.log('Retrying...');
            this.video(keyword,searchParams,imageParams,errorHandler,sectionCountStore,dataStore,urlStore,slideStore,index).then(data => resoleve(data)).catch(err => reject(err));
          }
          else {
            console.log('Exiting...');
            reject(err);
          }
        };
        if (!sectionCountStore) sectionCountStore = Math.floor(Math.random() * searchParams.maxSections) + searchParams.minSections;
        if (!dataStore) {
          let title = pos.title(keyword,sectionCountStore,searchParams.template);
          dataStore = {
            title: title,
            description: '',
            privacy: searchParams.privacy,
            category: searchParams.category,
            clips: []
          };
        }
        if (!urlStore) urlStore = [];
        if (!slideStore) slideStore = {
          slides: [],
          credits: [],
          description: []
        }
        if (!index) index = 0;
        if (searchParams.minResult > searchParams.maxResult) {
          reject('Maximum search results exceeded.');
        }
        else if (!urlStore.length) {
          this.search(keyword,searchParams.minResult,searchParams.maxResult)
          .then(data => {
            let self = this;
            urlStore = data.filter(el => self.findContextFromUrl(searchParams.template,el));
            if (urlStore.length) urlStore = shuffle(urlStore);
            searchParams.minResult += 10;
            this.video(keyword,searchParams,imageParams,errorHandler,sectionCountStore,dataStore,urlStore,slideStore,index).then(data => resoleve(data)).catch(err => reject(err));
          })
          .catch(err => {
            errorHandler(err);
          });
        }
        else if (!slideStore.slides.length) {
          let videoParams = imageParams;
          videoParams.type = 'intro',
          this.videoSlides(urlStore[0],1,videoParams)
          .then(data => {
            slideStore.slides = slideStore.slides.concat(data.slides);
            slideStore.credits = slideStore.credits.concat(data.credits);
            slideStore.description.push(data.description);
            urlStore.shift();
            index++;
            this.video(keyword,searchParams,imageParams,errorHandler,sectionCountStore,dataStore,urlStore,slideStore,index).then(data => resoleve(data)).catch(err => reject(err));
          })
          .catch(err => {
            urlStore.shift();
            errorHandler(err);
          })
        }
        else if (index < sectionCountStore+1) {
          this.videoSlides(urlStore[0],searchParams.count,imageParams)
          .then(data => {
            slideStore.slides = slideStore.slides.concat(data.slides);
            slideStore.credits = slideStore.credits.concat(data.credits);
            slideStore.description.push(data.description);
            urlStore.shift();
            index++;
            this.video(keyword,searchParams,imageParams,errorHandler,sectionCountStore,dataStore,urlStore,slideStore,index).then(data => resoleve(data)).catch(err => reject(err));
          })
          .catch(err => {
            urlStore.shift();
            errorHandler(err);
          })
        }
        else {
          dataStore.slides = slideStore.slides;
          dataStore.description = slideStore.description.join('\n') + '\nImage Credits\n' + slideStore.credits.join('\n');
          resolve(dataStore);
        }
      }
    });
  },

  makeVideoObject: function(callback,keyword,template,category,minSections,maxSections,maxResults,maxTries,sectionCountStore,dataStore,urlStore) {
    if (this.paused) return;
    if (!keyword || typeof keyword !== 'string') {
      console.log('Invalid keyword to search.');
      return;
    }
    if (!callback || typeof callback !== 'function') {
      callback = function(data) {
        if (data) console.log(data);
      };
    }
    if (!template) template = 'tips';
    if (!category) category = 0;
    if (!minSections) minSections = 5;
    if (!maxSections) maxSections = 10;
    if (!maxResults) maxResults = 100;
    if (!maxTries) maxTries = 1;
    if (!sectionCountStore) sectionCountStore = Math.floor(Math.random() * maxSections) + minSections;
    let title = pos.title(keyword,sectionCountStore,template);
    if (!dataStore) {
      dataStore = {
        title: title,
        description: '',
        category: category,
        privacy: 'Public',
        clips: []
      };
    }
    if (!urlStore) urlStore = [];
    let errorHandler = function(error) {
      console.log(error);
      if (maxTries > 10) {
        callback(dataStore);
        console.log('Exiting...');
        return true;
      }
      console.log('Re-trying...');
      maxTries++;
      return false;
    };
    if (!urlStore.length) {
      this.resultsFromKeyword(keyword,rand('bing','google'),maxResults).then(results => {
        urlStore = results;
        this.makeVideoObject(callback,keyword,template,category,minSections,maxSections,maxResults,maxTries,sectionCountStore,dataStore,urlStore);
      }).catch(err => {
        let exit = errorHandler(err);
        if (exit) return;
        this.makeVideoObject(callback,keyword,template,category,minSections,maxSections,maxResults,maxTries,sectionCountStore,dataStore,urlStore);
      });
    }
    else if (!dataStore.clips.length) {
      let urlIndex = Math.floor(Math.random() * urlStore.length);
      let url = urlStore[urlIndex];
      urlStore.splice(urlIndex,1);
      this.getWebpageObject(url).then(data => {
        let text = this.firstParagraph(data,keyword,template);
        if (text) dataStore.clips.push(text);
        this.makeVideoObject(callback,keyword,template,category,minSections,maxSections,maxResults,maxTries,sectionCountStore,dataStore,urlStore);
      }).catch(err => {
        let exit = errorHandler(err);
        if (exit) return;
        this.makeVideoObject(callback,keyword,template,category,minSections,maxSections,maxResults,maxTries,sectionCountStore,dataStore,urlStore);
      });
    }
    else if (dataStore.clips.length < sectionCountStore) {
      let urlIndex = Math.floor(Math.random() * urlStore.length);
      let url = urlStore[urlIndex];
      urlStore.splice(urlIndex,1);
      this.getWebpageObject(url).then(data => {
        let headers = [];
        let text = this.randomParagraph(data,keyword,template,headers,10);
        if (text) dataStore.clips.push(text);
        this.makeVideoObject(callback,keyword,template,category,minSections,maxSections,maxResults,maxTries,sectionCountStore,dataStore,urlStore);
      }).catch(err => {
        let exit = errorHandler(err);
        if (exit) return;
        this.makeVideoObject(callback,keyword,template,category,minSections,maxSections,maxResults,maxTries,sectionCountStore,dataStore,urlStore);
      });
    }
    else {
      callback(dataStore);
    }
  }

};

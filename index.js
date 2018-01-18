const request = require('request-promise');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const rand = require('bmjs-random');
const pos = require('bmjs-engpos');

module.exports = {

  savePath: '',
  downloadedImageMetadata: [],
  downloadedImageLinks: [],
  paragraphTags: ['p','div'],
  embeddedTags: ['a','span','em','strong','code','b'],
  headerTags: ['h1','h2','h3','h4','h5','h6'],
  listTags: ['ul','ol','li'],
  punctuationMarks: ['.','!','?',':','"'],
  paused: false,

  pause: function() {
    this.paused = true;
  },

  unpause: function() {
    this.paused = false;
  },

  init: function() {
    this.downloadedImageLinks = [];
    this.downloadedImageMetadata = [];
  },

  imageFromKeyword: function(keyword,queryParams,extractAll,searchSource) {
    if (this.paused) return;
    if (!keyword || typeof keyword !== 'string') {
      console.log('Invalid keyword entered.');
      return;
    }
    let parsedKeyword = keyword.replace(/\s/g,'%20');
    let hasInvalidChars = parsedKeyword.match(/[^0-9a-zA-Z%\+]/);
    if (hasInvalidChars) {
      console.log(`Invalid characters in entered keyword: ${keyword}. Must contain only words and spaces.`);
      return;
    }
    let searchUrl;
    if (!searchSource || searchSource === 'flickr') {
      searchUrl = 'https://www.flickr.com/search/?text=' + parsedKeyword;
    }
    if (queryParams && typeof queryParams === 'string' && queryParams.length > 0 && queryParams[0] === '&') {
      searchUrl += queryParams;
    }
    searchUrl += '&page=';
    return new Promise((resolve,reject) => {
      let options = {
        method: 'GET',
        uri: searchUrl+1,
        gzip: true
      };
      request(options).then(pageOneHtml => {
        pageOneHtml = pageOneHtml.replace(/(\n|\r)/g,'');
        let imageCount, imagesPerPage;
        if (pageOneHtml.match(/View\sall\s[0-9,]+/)) {
          imageCount = pageOneHtml.match(/View\sall\s[0-9,]+/)[0];
        }
        if (pageOneHtml.match(/"perPage":[0-9]+/)) {
          imagesPerPage = pageOneHtml.match(/"perPage":[0-9]+/)[0];
        }
        imageCount = parseInt(imageCount.replace(/(View\sall\s|,)/g,''));
        imagesPerPage = parseInt(imagesPerPage.replace(/("perPage":)/g,''));
        let lastPage = Math.floor(imageCount / imagesPerPage);
        let randomPage = Math.floor(Math.random() * lastPage) + 1;
        let options = {
          method: 'GET',
          uri: searchUrl+randomPage,
          gzip: true
        };
        request(options).then(randomPageHtml => {
          randomPageHtml = randomPageHtml.replace(/(\n|\r)/g,'');
          if (searchUrl.includes('flickr.com') && randomPageHtml.match(/"photos":{"_data":\[[^\]]+\]/)) {
            let extractedPhotos = randomPageHtml.match(/"photos":{"_data":\[[^\]]+\]/)[0];
            extractedPhotos = JSON.parse(extractedPhotos.replace(/null,/g,'').replace(/"photos":{"_data":/,''));
            if (!extractedPhotos.length) reject('No photos found for keyword: ' + keyword);
            let extractCount = extractAll ? extractedPhotos.length : 1;
            for (let i = 0; i < extractCount; i++) {
              let index = Math.floor(Math.random() * extractedPhotos.length);
              let selectedPhoto = extractedPhotos[index];
              let obj = {
                title: selectedPhoto.title,
                author: selectedPhoto.realname || selectedPhoto.username || selectedPhoto.ownerNsid,
                url: 'https://www.flickr.com/photos/' + selectedPhoto.pathAlias + '/' + selectedPhoto.id
              }
              if (this.downloadedImageLinks.includes(obj.url)) {
                continue;
              }
              if (selectedPhoto.sizes.l) {
                obj.image = 'https:' + selectedPhoto.sizes.l.url;
                obj.width = selectedPhoto.sizes.l.width;
                obj.height = selectedPhoto.sizes.l.height;
                obj.filename = path.basename(obj.image.split('?')[0]);
              }
              else if (selectedPhoto.sizes.z) {
                obj.image = 'https:' + selectedPhoto.sizes.z.url;
                obj.width = selectedPhoto.sizes.z.width;
                obj.height = selectedPhoto.sizes.z.height;
                obj.filename = path.basename(obj.image.split('?')[0]);
              }
              else if (selectedPhoto.sizes.c) {
                obj.image = 'https:' + selectedPhoto.sizes.c.url;
                obj.width = selectedPhoto.sizes.c.width;
                obj.height = selectedPhoto.sizes.c.height;
                obj.filename = path.basename(obj.image.split('?')[0]);
              }
              else if (selectedPhoto.sizes.m) {
                obj.image = 'https:' + selectedPhoto.sizes.m.url;
                obj.width = selectedPhoto.sizes.m.width;
                obj.height = selectedPhoto.sizes.m.height;
                obj.filename = path.basename(obj.image.split('?')[0]);
              }
              this.downloadedImageMetadata.push(obj);
              this.downloadedImageLinks.push(obj.url);
              extractedPhotos.splice(index,1);
            }
            resolve('Finished parsing image objects.');
          }
        }).catch(err => reject('Error accessing random image results page for keyword: ' + keyword));
      }).catch(err => reject('Error accessing first image results page for keyword: ' + keyword));
    });
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

  nearestParent: function(element) {
    if (this.paused) return;
    let search = [];
    if (element.parent) {
      search.push(element.parent.name);
    }
    if (search.length) {
      if ((search.includes('h1') || search.includes('h2') || search.includes('h3') || search.includes('h4') || search.includes('h5') || search.includes('h6')) || (search.includes('a') || search.includes('span') || search.includes('b') || search.includes('strong') || search.includes('em')) && this.headerTags.includes(element.parent.parent.name)) {
        return 'HEADER';
      }
      else if (search.includes('li')) {
        return 'LIST';
      }
      else if (search.includes('p') || search.includes('div')) {
        return 'TEXT';
      }
      else if (search.includes('a') && !this.paragraphTags.includes(element.parent.parent.name)) {
        return 'LINK';
      }
      else if (search.includes('a') || search.includes('span') || search.includes('b') || search.includes('strong') || search.includes('em')) {
        return 'EMBED';
      }
      else {
        this.nearestParent(element.parent);
      }
    }
  },

  destructurePageText: function(elements) {
    if (this.paused) return;
    if (!elements || typeof elements !== 'object') {
      return;
    }
    let data = '';
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].type === 'text') {
        let type = this.nearestParent(elements[i]);
        if (elements[i].data.match(/[a-z\.\!\?\:\"]/) && type !== undefined) {
          data += '[' + JSON.stringify({content: elements[i].data, type: type}) + ']';
        }
      }
      else if (elements[i].children && elements[i].type !== 'comment' && elements[i].name !== 'script' && elements[i].name !== 'style') {
        data += this.destructurePageText(elements[i].children);
      }
    }
    return data;
  },

  filterPageText: function(data) {
    if (!data || typeof data !== 'string') {
      return;
    }
    let rawData = JSON.parse(data.replace(/\}\]\[\{/g,'},{'));
    let objCount = 0;
    let objs = [{h: '', p: '', li: [], a: []}];
    for (let i = 0; i < rawData.length; i++) {
      if ((rawData[i].type === 'HEADER' && i > 0) || (objs[objCount] && objs[objCount].p && !objs[objCount].p[objs[objCount].p.length-1].match(/[\s]/) && rawData[i].content[0].match(/[A-Z]/))) {
        objCount++;
      }
      if (objs[objCount] === undefined) {
        objs[objCount] = {h: '', p: '', li: [], a: []};
      }
      if (rawData[i].type === 'TEXT' || rawData[i].type === 'EMBED') {
        objs[objCount].p += rawData[i].content;
      }
      else if (rawData[i].type === 'HEADER') {
        objs[objCount].h += rawData[i].content;
      }
      else if (rawData[i].type === 'LIST') {
        objs[objCount].li.push(rawData[i].content);
      }
      else if (rawData[i].type === 'LINK') {
        objs[objCount].a.push(rawData[i].content);
      }
    }
    let filteredObjs = [];
    let searchRegex = /\s[a-zA-Z\)]+[\.\!\?]/;
    for (let i = 0; i < objs.length; i++) {
      if (!filteredObjs.length && objs[i].p.length < 50) {
        continue;
      }
      if (!objs[i].p.match(searchRegex)) {
        objs[i].p = '';
      }
      let list = [];
      for (let j = 0; j < objs[i].li.length; j++) {
        if (!objs[i].li[j].match(searchRegex)) {
          objs[i].li.splice(j,1);
        }
        else if (objs[i].li[j]) {
          list.push(objs[i].li[j]);
        }
      }
      if (!(objs[i].p || objs[i].li.length || objs[i].h)) {
        continue;
      }
      if (filteredObjs.length > 0 && !filteredObjs[filteredObjs.length-1].paragraph.length && !objs[i].p && !objs[i].h) {
        break;
      }
      let header = '';
      if (objs[i].h) {
        header = objs[i].h.replace(/([^A-Z]*)([A-Z])/,'$2').trim();
      }
      let paragraph = objs[i].p;
      if (header || paragraph) {
        filteredObjs.push({
          header: header,
          paragraph: paragraph,
          list: list,
        });
      }
    }
    let sortedObjs = {};
    let sortCount = 0;
    for (let i = 0; i < filteredObjs.length; i++) {
      if (filteredObjs[i].header) {
        sortCount++;
      }
      let index = '' + sortCount;
      if (!sortedObjs[index]) {
        sortedObjs[index] = [];
      }
      sortedObjs[index].push(filteredObjs[i]);
    }
    return sortedObjs;
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
    return text
    .replace(/^(\n|\s|\r|\t)*/g,'')
    .replace(/(\n|\s|\r|\t)*$/g,'')
    .replace(/(\n|\r|\t|\s+)/g,' ')
    .replace(/^[^A-Z]*([A-Z])/,'$1')
    .replace(/([a-zA-Z])(\:\s.+|\s\(.+|\s\-\s.+)/,'$1')
    .replace(/[\.\?\!]$/,'');
  },

  parseText: function(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    return text
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
    .replace(/([\!\?\.])\s*(\w)/g,'$1|||||$2');
  },

  validateHeader: function(sentence,url) {
    if (!sentence || !url || typeof sentence !== 'string' || typeof url !== 'string') {
      return false;
    }
    if (sentence.match(/[a-z][A-Z]/)) return false;
    if (sentence.match(/[^a-zA-Z\s\,\/]/)) return false;
    if (!sentence.match(/^[A-Z]/)) return false;
    if (sentence.match(/[A-Z][A-Z]/)) return false;
    if (this.matchUrl(sentence,url)) return false;
    if (sentence.match(/\b(we|i|our|ourselves|ourself|my|us|me|myself|he|his|him|himself|she|her|hers|herself)\b/i)) return false;
    if (sentence.match(/(\d\:\d|\d\d\d\d)/)) return false;
    if (sentence.match(/\b(today|tomorrow|yesterday|last\sweek|last\smonth|last\syear|next\sweek|next\smonth|next\syear|this\sweek|this\smonth|this\syear)\b/i)) return false;
    if (sentence.match(/\b(January|February|March|April|May|June|July|August|September|November|December)\b/)) return false;
    if (sentence.match(/\b(error|problem|issue|trouble|unable)/i) && sentence.match(/\b(server|request|response|page|web|gateway|data|loading|load|open|opening)\b/i)) return false;
    if (sentence.match(/\b(please|thanks|thankyou|thank\syou|hello|hi|hey|greetings|welcome|goodbye|bye)\b/i)) return false;
    if (sentence.match(/(shit|fuck|dick|piss|cunt|bitch|bastard)/)) return false;
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
    if (sentence.match(/\b(join|member|post|reply|view|click|view|watch|see|request|respond|edit|save|add|open|review|checkout|check\sout|subscribe|sign\sup|signup|read|learn|comment|publish|feedback|newsletter|update|upload|buy|shipping|offer|cart)/i)) return false;
    return true;
  },

  validateText: function(sentence,url) {
    if (!sentence || !url || typeof sentence !== 'string' || typeof url !== 'string') {
      return false;
    }
    if (sentence.match(/[a-z][A-Z]/)) return false;
    if (!sentence.match(/[\!\.\?]$/)) return false;
    if (!sentence.match(/^[A-Z\"]/)) return false;
    if (sentence.match(/[A-Z][A-Z]/)) return false;
    if (sentence.match(/[\%\$]/)) return false;
    if (this.matchUrl(sentence,url)) return false;
    if (sentence.match(/\b(we|i|our|ourselves|ourself|my|us|me|myself|he|his|him|himself|she|her|hers|herself)\b/i)) return false;
    if (sentence.match(/(\d\:\d|\d\d\d\d)/)) return false;
    if (sentence.match(/\b(today|tomorrow|yesterday|last\sweek|last\smonth|last\syear|next\sweek|next\smonth|next\syear|this\sweek|this\smonth|this\syear)\b/i)) return false;
    if (sentence.match(/\b(January|February|March|April|May|June|July|August|September|November|December)\b/)) return false;
    if (sentence.match(/\b(error|problem|issue|trouble|unable)/i) && sentence.match(/\b(server|request|response|page|web|gateway|data|loading|load|open|opening)\b/i)) return false;
    if (sentence.match(/\b(please|thanks|thankyou|thank\syou|hello|hi|hey|greetings|welcome|goodbye|bye)\b/i)) return false;
    if (sentence.match(/(shit|fuck|dick|piss|cunt|bitch|bastard)/)) return false;
    return true;
  },

  findKeyword: function(keyword,sentence,url) {
    if (!keyword || typeof keyword !== 'string' || !sentence || !url || typeof sentence !== 'string' || typeof url !== 'string') {
      return;
    }
    if (sentence.includes(keyword)) return true;
    let parsedUrl = url.replace(/(http|https)(\:\/\/)(www\.)*([a-z\-]+)([.])+/,'$5').replace(/[^a-z][^a-z]*/gi,'-');
    if (parsedUrl.includes(keyword.replace(/[^a-z][^a-z]*/gi,'-'))) return true;
    let keywordSplit = keyword.replace(/[^\w]/gi,' ').replace(/\s+/g,' ').trim().toLowerCase().split(' ');
    let matches = 0;
    for (let i = 0; i < keywordSplit.length; i++) {
      if (sentence.includes(keywordSplit[i])) matches++;
      if (matches > 1) return true;
    }
    return false;
  },

  findContext: function(template,sentence,url) {
    if (!template || typeof template !== 'string' || !sentence || !url || typeof sentence !== 'string' || typeof url !== 'string') {
      return;
    }
    let parsedUrl = url.replace(/(http|https)(\:\/\/)(www\.)*([a-z\-]+)([.])+/,'$5').replace(/[^a-z][^a-z]*/gi,'-');
    switch (template) {
      case 'tips':
      if (sentence.match(/\b(can|can\'t|cannot|may|might|should|shouldn\'t|could|couldn\'t|ought\sto|need\sto|have\sto|must|will|won\'t|would|wouldn\'t|don\'t|try|avoid|ensure|make\ssure|consider|remember|understand|realize|recognize|know|start|stop|important|critical|crucial|main|major|essential|necessary|always|sometimes|often|never|probably|possibly|likely|maybe|if|when|because)\b/)) return true;
      return false;
      case 'facts':
      if (sentence.match(/\b(largely|greatly|predominantly|highly|slightly|extremely|mildly|moderately|somewhat|typically|characteristically|usually|sometimes|often|commonly|generally|really|actually|very|never|rarely|level\sof|amount\sof|quantity\sof|degree\sof|number\sof|typical\sof|characteristic\sof|look|looks|seem|seems|sound|sounds|appear|appears|become|becomes|taste|tastes|smell|smells|stay|stays|remain|remains)\b/i)) return true;
      return false;
      case 'reviews':
      if (sentence.match(/\b(good|better|best|bad|worse|worst|poor|great|positive|negative|advantage|disadvantage|pros|cons|plus|minus)\b/)) return true;
      return false;
      default: return false;
    }
  },

  match: function(paragraph,url,keyword,template) {
    if (!paragraph || !url || typeof paragraph !== 'string' || typeof url !== 'string' || !keyword || !template || typeof keyword !== 'string' || typeof template !== 'string') {
      return false;
    }
    let splitParagraph = paragraph.replace(/\!+/g,'!').replace(/\?+/g,'?').replace(/\.+/g,'.').replace(/(\s[A-Za-z])\./g,'$1').replace(/\.([0-9])/g,' point $1').replace(/\.([A-Z]|[a-z])/g,'$1').replace(/([a-z])(A\s)/g,'$1. $2').replace(/([\!\?\.])\s*(\w)/g,'$1|||||$2').split('|||||');
    let filtered = [];
    for (let i = 0; i < splitParagraph.length; i++) {
      if (this.validateText(splitParagraph[i],url,keyword,template)) filtered.push(splitParagraph[i]);
    }
    if (filtered.length) return filtered;
    return [];
  },

  filter: function(paragraph,url) {
    if (!paragraph || !url || typeof paragraph !== 'string' || typeof url !== 'string') {
      return false;
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

  introText: function(obj,keyword,template) {
    if (!obj || typeof obj !== 'object' || !obj.body || !obj.body['0'] || !obj.body['0'][0] || !keyword || !template || typeof keyword !== 'string' || typeof template !== 'string') {
      return;
    }
    let data = obj.body['0'];
    let text = '';
    for (let i = 0; i < data.length; i++) {
      if (data[i].paragraph.length < 200 && data[i].list.join(' ').length < 200) continue;
      if (!this.findKeyword(keyword,data[i].paragraph,obj.url)) continue;
      let p = this.filter(data[i].paragraph,obj.url,keyword,template);
      if (p) {
        if (text) text += ' ';
        text += p;
      }
      if (data[i].list.length) {
        for (let j = 0; j < data[i].list.length; j++) {
          let li = this.filter(data[i].list[j],obj.url,keyword,template);
          if (li) {
            if (text) text += ' ';
            text += li;
          }
        }
      }
      if (text) break;
    }
    return text;
  },

  sectionText: function(obj,keyword,template,headers,maxTries) {
    if (!obj || typeof obj !== 'object' || !obj.body || !keyword || !template || typeof keyword !== 'string' || typeof template !== 'string') {
      return;
    }
    let maxCount = Math.abs(Object.keys(obj.body).length-1);
    let startCount = Math.floor(Math.random() * maxCount) + 1;
    let text = '';
    for (let objCount = startCount; objCount < maxCount; objCount++) {
      let data = obj.body[`${objCount}`];
      if (headers.includes(data[0].header.toLowerCase())) {
        continue;
      }
      for (let i = 0; i < data.length; i++) {
        if (data[i].paragraph.length < 200 && data[i].list.join(' ').length < 200) continue;
        if (!this.findKeyword(keyword,data[i].paragraph,obj.url) && !this.findKeyword(keyword,data[i].list.join(' '),obj.url)) continue;
        let p = this.filter(data[i].paragraph,obj.url,keyword,template);
        if (p) {
          if (text) text += ' ';
          text += p;
        }
        if (data[i].list.length) {
          for (let j = 0; j < data[i].list.length; j++) {
            let li = this.filter(data[i].list[j],obj.url,keyword,template);
            if (li) {
              if (text) text += ' ';
              text += li;
            }
          }
        }
      }
      if (text) break;
    }
    if (!text) {
      if (maxTries && typeof maxTries === 'number') {
        maxTries--;
        this.sectionText(obj,keyword,template,headers,maxTries);
      }
    }
    return text;
  },

  extractTextTags: function($,url) {
    let store = [];
    let obj = {content: [], headers: [], links: []};
    let lastHeader = '';
    let lastLink = '';
    let self = this;
    $('div').contents()
    .each(function(i,el) {
      let content;
      if (el.tagName === 'p') {
        if ($(this).children().length) {

          $(this).children().each(function(j,subEl) {
            console.log(subEl.data);
            if (((subEl.nextSibling && subEl.nextSibling.tagName === 'br') || j === 0) && (subEl.tagName === 'h1' || subEl.tagName === 'h2' || subEl.tagName === 'h3' || subEl.tagName === 'h4' || subEl.tagName === 'b' || subEl.tagName === 'strong')) {
              content = self.parseHeader($(this).text());
              if (!store.includes(content) && self.validateHeader(content,url)) {
                store.push(content);
                lastHeader = content;
                obj.headers.push(content);
              }
            }
            else {
              content = self.parseText($(this).text());
              if (!store.includes(content)) {
                store.push(content);
                obj.content.push({text: content, header: lastHeader, link: lastLink});
              }
            }
          });
        }
        else {
          content = self.parseText($(this).text());
          if (!store.includes(content)) {
            store.push(content);
            obj.content.push({text: content, header: lastHeader, link: lastLink});
          }
        }
      }
      else if (el.tagName === 'h1' || el.tagName === 'h2' || el.tagName === 'h3' || el.tagName === 'h4' || el.tagName === 'b' || el.tagName === 'strong') {
        content = self.parseHeader($(this).text());
        if (!store.includes(content) && self.validateHeader(content,url)) {
          store.push(content);
          lastHeader = content;
          obj.headers.push(content);
        }
      }
      else if (el.tagName === 'ul' || el.tagName === 'ol') {
        content = self.parseText($(this).text());
        if (!store.includes(content)) {
          store.push(content);
          obj.content.push({text: content, header: lastHeader, link: lastLink});
        }
      }
      else if (el.type === 'text') {
        content = self.parseText($(this).parent().text());
        if (!store.includes(content)) {
          store.push(content);
          obj.content.push({text: content, header: lastHeader, link: lastLink});
        }
      }
      else if (el.tagName === 'a') {
        content = self.parseHeader($(this).text());
        if (content.length > 20 && !store.includes(content) && self.validateLink(content,url)) {
          store.push(content);
          lastLink = content;
          obj.links.push(content);
        }
      }
    });
    let filteredContent = [];
    for (let i = 0; i < obj.content.length; i++) {
      let filtered = this.filter(obj.content[i].text,url);
      if (filtered.length) {
        filteredContent.push({text: filtered, header: obj.content[i].header, link: obj.content[i].link})
      }
    }
    obj.content = filteredContent;
    return obj;
  },

  getPageText: function(url) {
    if (this.paused) return;
    return new Promise((resolve,reject) => {
      let options = {
        method: 'GET',
        uri: url,
        gzip: true
      };
      request(options).then(html => {
        html = html.replace(/(\s*\n\s*|\s*\r\s*)/g,'');
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
        pageObject.body = this.extractTextTags($,url);
        resolve(pageObject);
      }).catch(err => reject(err));
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
      this.getPageText(url).then(data => {
        let text = this.introText(data,keyword,template);
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
      this.getPageText(url).then(data => {
        let headers = [];
        let text = this.sectionText(data,keyword,template,headers,10);
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

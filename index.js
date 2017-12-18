const request = require('request-promise');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const rand = require('bmjs-random');

module.exports = {
  savePath: '',
  downloadedImageMetadata: [],
  downloadedImageLinks: [],
  paragraphTags: ['p','div'],
  embeddedTags: ['a','span','em','strong','code','b'],
  headerTags: ['h1','h2','h3','h4','h5','h6'],
  listTags: ['ul','ol','li'],
  punctuationMarks: ['.','!','?',':','"'],
  init: function() {
    this.downloadedImageLinks = [];
    this.downloadedImageMetadata = [];
  },
  splitStopwords: function(sentence) {
    if (!sentence || typeof sentence !== 'string') {
      return;
    }
    let phrases = [
      {search: /\baccording\sto\s/gi, replace: 'according_to '},
      {search: /\bahead\sof\s/gi, replace: 'ahead_of '},
      {search: /\ba\sla\s/gi, replace: 'a_la '},
      {search: /\balong\swith\s/gi, replace: 'along_with '},
      {search: /\bapart\sfrom\s/gi, replace: 'apart_from '},
      {search: /\bas\sper\s/gi, replace: 'as_per '},
      {search: /\bas\sto\s/gi, replace: 'as_to '},
      {search: /\bas\swell\sas\s/gi, replace: 'as_well_as '},
      {search: /\baway\sfrom\s/gi, replace: 'away_from '},
      {search: /\bbecause\sof\s/gi, replace: 'because_of '},
      {search: /\bbut\sfor\s/gi, replace: 'but_for '},
      {search: /\bby\smeans\sof\s/gi, replace: 'by_means_of '},
      {search: /\bclose\sto\s/gi, replace: 'close_to '},
      {search: /\bcontrary\sto\s/gi, replace: 'contrary_to '},
      {search: /\bdepending\son\s/gi, replace: 'depending_on '},
      {search: /\bdue\sto\s/gi, replace: 'due_to '},
      {search: /\bexcept\sfor\s/gi, replace: 'except_for '},
      {search: /\bforward\sof\s/gi, replace: 'forward_of '},
      {search: /\bfurther\sto\s/gi, replace: 'further_to '},
      {search: /\bin\saddition\sto\s/gi, replace: 'in_addition_to '},
      {search: /\bin\sbetween\s/gi, replace: 'in_between '},
      {search: /\bin\scase\sof\s/gi, replace: 'in_case_of '},
      {search: /\bin\sthe\sface\sof\s/gi, replace: 'in_the_face_of '},
      {search: /\bin\sfavor\sof\s/gi, replace: 'in_favor_of '},
      {search: /\bin\sfront\sof\s/gi, replace: 'in_front_of '},
      {search: /\bin\slieu\sof\s/gi, replace: 'in_lieu_of '},
      {search: /\bin\sspite\sof\s/gi, replace: 'in_spite_of '},
      {search: /\binstead\sof\s/gi, replace: 'instead_of '},
      {search: /\bin\sterms\sof\s/gi, replace: 'in_terms_of '},
      {search: /\bin\sview\sof\s/gi, replace: 'in_view_of '},
      {search: /\bnear\sto\s/gi, replace: 'near_to '},
      {search: /\bnext\sto\s/gi, replace: 'next_to '},
      {search: /\bon\saccount\sof\s/gi, replace: 'on_account_of '},
      {search: /\bon\sbehalf\sof\s/gi, replace: 'on_behalf_of '},
      {search: /\bon\sboard\s/gi, replace: 'on_board '},
      {search: /\bon\sto\s/gi, replace: 'on_to '},
      {search: /\bon\stop\sof\s/gi, replace: 'on_top_of '},
      {search: /\bopposite\sto\s/gi, replace: 'opposite_to '},
      {search: /\bother\sthan\s/gi, replace: 'other_than '},
      {search: /\bout\sof\s/gi, replace: 'out_of '},
      {search: /\boutside\sof\s/gi, replace: 'outside_of '},
      {search: /\bowing\sto\s/gi, replace: 'owing_to '},
      {search: /\bpreparatory\sto\s/gi, replace: 'preparatory_to '},
      {search: /\bprior\sto\s/gi, replace: 'prior_to '},
      {search: /\bregardless\sof\s/gi, replace: 'regardless_of '},
      {search: /\bsave\sfor\s/gi, replace: 'save_for '},
      {search: /\bthanks\sto\s/gi, replace: 'thanks_to '},
      {search: /\btogether\swith\s/gi, replace: 'together_with '},
      {search: /\bup\sagainst\s/gi, replace: 'up_against '},
      {search: /\bup\sto\s/gi, replace: 'up_to '},
      {search: /\bup\suntil\s/gi, replace: 'up_until '},
      {search: /\bwith\sreference\sto\s/gi, replace: 'with_reference_to '},
      {search: /\bwith\sregard\sto\s/gi, replace: 'with_regard_to '},
      {search: /\bwith\srespect\sto\s/gi, replace: 'with_respect_to '},
    ]
    let filteredPhrases = sentence;
    for (let i = 0; i < phrases.length; i++) {
      filteredPhrases = filteredPhrases.replace(phrases[i].search,phrases[i].replace);
    }
    let singleWordPrepositionsRegex = /(\b)(aboard|about|above|across|after|against|along|alongside|amid|amidst|among|amongst|anti|around|as|astride|at|atop|barring|before|behind|below|beneath|beside|besides|between|beyond|but|by|circa|concerning|considering|counting|despite|down|during|except|excepting|excluding|following|for|from|given|gone|in|including|inside|into|less|like|minus|near|notwithstanding|of|off|on|onto|opposite|outside|over|past|pending|per|plus|pro|re|regarding|respecting|round|save|saving|since|than|through|thru|throughout|till|to|touching|toward|towards|under|underneath|unlike|until|up|upon|versus|via|with|within|without|worth)([^_])/gi;
    let multiWordPrepositionRegex = /(\b)(according_to|ahead_of|a_la|along_with|apart_from|as_per|as_to|as_well_as|away_from|because_of|but_for|by_means_of|close_to|contrary_to|depending_on|due_to|except_for|forward_of|further_to|in_addition_to|in_between|in_case_of|in_the_face_of|in_favor_of|in_front_of|in_lieu_of|in_spite_of|instead_of|in_terms_of|in_view_of|near_to|next_to|on_account_of|on_behalf_of|on_board|on_to|on_top_of|opposite_to|other_than|out_of|outside_of|owing_to|preparatory_to|prior_to|regardless_of|save_for|together_with|up_against|up_to|up_until|with_reference_to|with_regard_to|with_respect_to)/gi;
    let commonVerbsRegex = /(\b)(be|is|are|am|was|were|being|been|do|does|did|doing|done|have|has|had|having)(\b)/gi;
    filteredPhrases = filteredPhrases.replace(singleWordPrepositionsRegex,'|||||$1$2$3|||||')
    .replace(multiWordPrepositionRegex,'|||||$1$2|||||')
    .replace(commonVerbsRegex,'|||||$2|||||')
    .replace(/(\,|\:|\-)/g,'|||||$1')
    .replace(/(\.|\?|\!)/g,'|||||$1')
    .replace(/\s*\|\|\|\|\|\s*/g,'|||||')
    .replace(/\|\|\|\|\|\|\|\|\|\|/g,'|||||');
    let filteredPhrasesArray = filteredPhrases.split('|||||')
    console.log(filteredPhrasesArray);
    return filteredPhrasesArray;
  },
  imageFromKeyword: function(keyword,queryParams,extractAll,searchSource) {
    if (!keyword || typeof keyword !== 'string') {
      throw new Error('Invalid keyword entered.');
    }
    let parsedKeyword = keyword.replace(/\s/g,'%20');
    let hasInvalidChars = parsedKeyword.match(/[^0-9a-zA-Z%]/);
    if (hasInvalidChars) {
      throw new Error('Invalid characters in entered keyword. Must contain only words and spaces.');
    }
    let searchUrl;
    if (!searchSource) {
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
        if (imageCount) {
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
              if (extractedPhotos) {
                try {
                  extractedPhotos = JSON.parse(extractedPhotos.replace(/null,/g,'').replace(/"photos":{"_data":/,''));
                }
                catch (error) {
                  reject('Unable to parse JSON from: ' + searchUrl + randomPage);
                }
                let extractCount = extractAll ? extractedPhotos.length : 1;
                for (let i = 0; i < extractCount; i++) {
                  let index = Math.floor(Math.random() * extractedPhotos.length);
                  let selectedPhoto = extractedPhotos[index];
                  try {
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
                    if (obj.image.length > 6) {

                    }
                    this.downloadedImageMetadata.push(obj);
                    this.downloadedImageLinks.push(obj.url);
                  }
                  catch (error) {
                    console.log('Error parsing image object at index: ' + index);
                  }
                  extractedPhotos = extractedPhotos.splice(index,1);
                }
                resolve('Finished parsing image objects.');
              }
              else {
                reject('Unable to extract photos from keyword ' + parsedKeyword + 'on page ' + randomPage + '.');
              }
            }
          })
          .catch(error => {
            reject(error);
          });
        }
        else {
          reject('No image to download.');
        }
      })
      .catch(error => {
        reject(error);
      });
    });
  },
  getSearchLinks: function(html,searchSource) {
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
    let firstFound = false;
    for (let i = 0; i < objs.length; i++) {
      firstFound = firstFound || objs[i].p.match(/\s[a-zA-Z\)]+[\.\!\?]\s[A-Z]/);
      if (!firstFound) {
        continue;
      }
      if (!objs[i].p.match(/\s[a-zA-Z\)]+[\.\!\?]/) || objs[i].p.match(/\b(we|We|i|I|me|Me|my|My|our|Our|ours|Ours|us|Us|20\d\d)\b/)) {
        objs[i].p = '';
      }
      let parsedList = [];
      let listRaw = '';
      for (let j = 0; j < objs[i].li.length; j++) {
        if (!objs[i].li[j].match(/\s[a-zA-Z\)]+[\.\!\?]/) || objs[i].li[j].match(/\b(we|We|i|I|me|Me|my|My|our|Our|ours|Ours|us|Us|20\d\d)\b/)) {
          objs[i].li.splice(j,1);
        }
        else {
          let listItem = objs[i].li[j].replace(/[^A-Za-z0-9\,\-\.\?\!\(\)\s\:\%\$\"\'\/\&]/g,'').replace(/\s+/g,' ').replace(/\d+(\.\s|\s\-\s)/g,'').replace(/(\s)([A-Za-z])(\.)/g,'$1$2').replace(/(\.)([A-Za-z])/g,'$2').replace(/(\.)([0-9])/g,' point $2').trim().replace(/(\.)(\s)([A-Z])/g,'$1|||||$3').split('|||||');
          if (listItem) {
            parsedList.push(listItem);
            listRaw += ' ' + listItem.join(' ').replace(/[^A-Za-z]/g,' ');
          }
        }
      }
      if (listRaw) {
        listRaw = listRaw.replace(/[^A-Za-z]/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
      }
      if (!(objs[i].p || objs[i].li.length || objs[i].h)) {
        continue;
      }
      if (filteredObjs.length > 0 && !filteredObjs[filteredObjs.length-1].paragraph.length && !objs[i].p && !objs[i].h) {
        break;
      }
      let parsedHeader = '';
      if (objs[i].h) {
        parsedHeader = objs[i].h.replace(/([^A-Z]*)([A-Z])/,'$2').trim();
      }
      let parsedText = objs[i].p.replace(/[^A-Za-z0-9\,\-\.\?\!\(\)\s\:\%\$\"\'\/\&]/g,'').replace(/\s+/g,' ').replace(/\d+(\.\s|\s\-\s)/g,'').replace(/(\s)([A-Za-z])(\.)/g,'$1$2').replace(/(\.)([A-Za-z])/g,'$2').replace(/(\.)([0-9])/g,' point $2').trim().replace(/(\.|\?|\!)(\s)([A-Z])/g,'$1|||||$3');
      let parsedParagraphs = parsedText.split('|||||');
      for (let j = 0; j < parsedParagraphs.length; j++) {
        if (!parsedParagraphs[j].match(/^[A-Z].+[\.\!\?]$/) || parsedParagraphs[j].match(/[a-z][A-Z]/)) {
          parsedParagraphs.splice(j,1);
        }
      }
      let paragraphRaw = '';
      if (parsedParagraphs.length) {
        paragraphRaw = parsedParagraphs.join(' ').replace(/[^A-Za-z]/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
      }
      if (parsedHeader || parsedParagraphs.length) {
        filteredObjs.push({
          header: parsedHeader,
          paragraph: parsedParagraphs,
          paragraphRaw: paragraphRaw,
          list: parsedList,
          listRaw: listRaw
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
  introText: function(obj,keywords) {
    if (!obj || typeof obj !== 'object' || !obj.body['0'] || !obj.body['0'][0] || !(obj.body['0'][0].paragraphRaw || obj.body['0'][0].listRaw)) {
      return;
    }
    let data = obj.body['0'];
    let video = [];
    let text = '';
    for (let i = 0; i < data.length; i++) {
      let matches = false;
      if (keywords && keywords.length) {
        for (let j = 0; j < keywords.length; j++) {
          if (data[i].paragraphRaw.includes(keywords[j].toLowerCase()) || data[i].listRaw.includes(keywords[j].toLowerCase())) {
            matches = true;
            break;
          }
        }
      }
      else {
        matches = true;
      }
      if (data[i].paragraph.length && matches) {
        for (let j = 0; j < data[i].paragraph.length; j++) {
          let add;
          if (!text) {
            add = true;
          }
          else {
            add = rand(true,false);
          }
          if (add) {
            if (text) text += ' ';
            text += data[i].paragraph[j];
          }
        }
      }
      if (data[i].list.length && matches) {
        for (let j = 0; j < data[i].list.length; j++) {
          for (let k = 0; k < data[i].list[j].length; k++) {
            let add;
            if (!text) {
              add = true;
            }
            else {
              add = rand(true,false);
            }
            if (add) {
              if (text) text += ' ';
              text += data[i].list[j][k];
            }
          }
        }
      }
    }
    return text;
  },
  sectionText: function(obj,keywords,headers,maxTries) {
    if (!obj || typeof obj !== 'object' || !obj.body) {
      return;
    }
    let maxCount = Math.abs(Object.keys(obj.body).length-1);
    let startCount = Math.floor(Math.random() * maxCount) + 1;
    let video = [];
    let text = '';
    for (let objCount = startCount; objCount < maxCount; objCount++) {
      let data = obj.body[`${objCount}`];
      if (data[0].header && (data[0].header.match(/\b(subscribe|sign\sup|join|post|posts|comment|comments|reply|replies|community|newsletter|review|reviews|answer|answers)\b/i) || headers.includes(data[0].header.toLowerCase()))) {
        continue;
      }
      for (let i = 0; i < data.length; i++) {
        let matches = false;
        if (keywords && keywords.length) {
          for (let j = 0; j < keywords.length; j++) {
            if (data[i].paragraphRaw.includes(keywords[j].toLowerCase()) || data[i].listRaw.includes(keywords[j].toLowerCase())) {
              matches = true;
              break;
            }
          }
        }
        else {
          matches = true;
        }
        if (data[i].paragraph.length && matches) {
          for (let j = 0; j < data[i].paragraph.length; j++) {
            let add;
            if (!text) {
              add = true;
            }
            else {
              add = rand(true,false);
            }
            if (add) {
              if (text) text += ' ';
              text += data[i].paragraph[j];
            }
          }
        }
        if (data[i].list.length && matches) {
          for (let j = 0; j < data[i].list.length; j++) {
            for (let k = 0; k < data[i].list[j].length; k++) {
              let add;
              if (!text) {
                add = true;
              }
              else {
                add = rand(true,false);
              }
              if (add) {
                if (text) text += ' ';
                text += data[i].list[j][k];
              }
            }
          }
        }
      }
      if (text) {
        break;
      }
    }
    if (!text) {
      if (maxTries && typeof maxTries === 'number') {
        maxTries--;
        this.sectionText(obj,keywords,headers,maxTries);
      }
    }
    return text;
  },
  getPageText: function(url) {
    return new Promise((resolve,reject) => {
      if (!url || typeof url !== 'string' || !url.match(/(http:\/\/|https:\/\/)/)) {
        reject('Unable to get page text without valid URL.');
      }
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
        try {
          pageObject.title = $('title').text() || '';
          pageObject.description = $('meta[name="description"]').attr('content') || '';
          pageObject.keywords = $('meta[name="keywords"]').attr('content') || '';
          let paragraphs = $('body').contents() || undefined;
          if (paragraphs) {
            let data = this.destructurePageText(paragraphs);
            pageObject.body = this.filterPageText(data);
            let text = this.introText(pageObject,['training','dog']);
            console.log(text);
            resolve(pageObject);
          }
          else {
            reject('Retrieved page contains no text at: ' + url);
          }
        }
        catch (error) {
          reject(error);
        }
      })
      .catch(error => {
        reject(error);
      });
    });
  },
  resultsFromKeyword: function(keyword,searchSource,searchDomain,maxResults) {
    if (!keyword || typeof keyword !== 'string') {
      throw new Error('Invalid keyword entered.');
    }
    let parsedKeyword = keyword.replace(/\s/g,'+');
    let hasInvalidChars = parsedKeyword.match(/[^0-9a-zA-Z+]/);
    if (hasInvalidChars) {
      throw new Error('Invalid characters in entered keyword. Must contain only words and spaces.');
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
          resolve(results);
        }
        firstPageResults = firstPageResults.replace(/(\n|\r)/g,'');
        let resultCount;
        if (firstPageResults.match(/[0-9,]+\sresults/i)) {
          resultCount = parseInt(firstPageResults.match(/[0-9,]+\sresults/i)[0].replace(/(results|\s|,)/gi,''));
        }
        if (resultCount > maxResults) {
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
          })
          .catch(error => {
            reject(error);
          });
        }
        else {
          reject('Invalid results page selected.');
        }
      })
      .catch(error => {
        reject(error);
      });
    });
  }
};

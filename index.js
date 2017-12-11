const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

module.exports = {
  savePath: '',
  downloadedImageMetadata: [],
  downloadedImageLinks: [],
  embeddedTags: ['a','span','em','strong','code','b'],
  headerTags: ['h1','h2','h3','h4','h5','h6'],
  listTags: ['ul','ol'],
  init: function() {
    this.downloadedImageLinks = [];
    this.downloadedImageMetadata = [];
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
    let request;
    if (searchUrl.includes('https://')) {
      request = https;
    }
    else {
      request = http;
    }
    return new Promise((resolve,reject) => {
      request.get(searchUrl+1, res => {
        let pageOneHtml = '';
        res.on('data', data => {
          pageOneHtml += data;
        });
        res.on('end', () => {
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
            request.get(searchUrl+randomPage, res => {
              let randomPageHtml = '';
              res.on('data', data => {
                randomPageHtml += data;
              });
              res.on('end', () => {
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
                        reject('Error parsing image object at index: ' + index);
                      }
                      extractedPhotos = extractedPhotos.splice(index,1);
                    }
                    resolve('Finished parsing image objects.');
                  }
                  else {
                    reject('Unable to extract photos from keyword ' + parsedKeyword + 'on page ' + randomPage + '.');
                  }
                }
              });
            }).on('error', error => {
              reject('Error accessing URL');
            });
          }
          else {
            reject('Unable to extract photos from keyword ' + parsedKeyword + '.');
          }
        });
      }).on('error', error => {
        reject('Error accessing URL');
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
  getPageText: function(url) {
    return new Promise((resolve,reject) => {
      if (!url || typeof url !== 'string' || !url.match(/(http:\/\/|https:\/\/)/)) {
        reject('Unable to get page text without valid URL.');
      }
      let request;
      if (url.match(/https:\/\//)) {
        request = https;
      }
      else {
        request = http;
      }
      request.get(url, res => {
        let html = '';
        res.on('data', data => {
          html += data;
        });
        res.on('end', () => {
          html = html.replace(/(\s*\n\s*|\s*\r\s*)/g,'');
          let $ = cheerio.load(html);
          let pageObject = {
            title: '',
            description: '',
            body: '',
            subtitles: [],
            keywords: '',
            lists: []
          };
          try {
            pageObject.title = $('title').text() || '';
            pageObject.description = $('meta[name="description"]').attr('content') || '';
            pageObject.keywords = $('meta[name="keywords"]').attr('content') || '';
            let paragraphs = $('p') || undefined;
            let bodyData = [];
            if (paragraphs) {
              for (let i = 0; i < paragraphs.length; i++) {
                let paragraphCount = `${i}`;
                let data = {h: '', p: '', li: []};
                if (paragraphs[paragraphCount].prev && this.headerTags.includes(paragraphs[paragraphCount].prev.name)) {
                  for (let j = 0; j < paragraphs[paragraphCount].prev.children.length; j++) {
                    if (paragraphs[paragraphCount].prev.children[j].type === 'text') {
                      data.h += paragraphs[paragraphCount].prev.children[j].data;
                    }
                    else if (paragraphs[paragraphCount].prev.children[j].type === 'tag' && this.embeddedTags.includes(paragraphs[paragraphCount].prev.children[j].name)) {
                      for (let k = 0; k < paragraphs[paragraphCount].prev.children[j].children.length; k++) {
                        if (paragraphs[paragraphCount].prev.children[j].children[k].type === 'text') {
                          data.h += paragraphs[paragraphCount].prev.children[j].children[k].data;
                        }
                      }
                    }
                  }
                }
                else if (paragraphs[paragraphCount].parent && paragraphs[paragraphCount].parent.prev && this.headerTags.includes(paragraphs[paragraphCount].parent.prev.name)) {
                  for (let j = 0; j < paragraphs[paragraphCount].parent.prev.children.length; j++) {
                    if (paragraphs[paragraphCount].parent.prev.children[j].type === 'text') {
                      data.h += paragraphs[paragraphCount].parent.prev.children[j].data;
                    }
                    else if (paragraphs[paragraphCount].parent.prev.children[j].type === 'tag' && this.embeddedTags.includes(paragraphs[paragraphCount].parent.prev.children[j].name)) {
                      for (let k = 0; k < paragraphs[paragraphCount].parent.prev.children[j].children.length; k++) {
                        if (paragraphs[paragraphCount].parent.prev.children[j].children[k].type === 'text') {
                          data.h += paragraphs[paragraphCount].parent.prev.children[j].children[k].data;
                        }
                      }
                    }
                  }
                }
                if (paragraphs[paragraphCount].children && !Object.keys(paragraphs[paragraphCount].attribs).length) {
                  for (let j = 0; j < paragraphs[paragraphCount].children.length; j++) {
                    if (paragraphs[paragraphCount].children[j].type === 'text') {
                      data.p += paragraphs[paragraphCount].children[j].data;
                    }
                    else if (paragraphs[paragraphCount].children[j].type === 'tag' && this.embeddedTags.includes(paragraphs[paragraphCount].children[j].name)) {
                      if (data.p || data.h) {
                        for (let k = 0; k < paragraphs[paragraphCount].children[j].children.length; k++) {
                          if (paragraphs[paragraphCount].children[j].children[k].type === 'text') {
                            data.p += paragraphs[paragraphCount].children[j].children[k].data;
                          }
                        }
                      }
                      else {
                        for (let k = 0; k < paragraphs[paragraphCount].children[j].children.length; k++) {
                          if (paragraphs[paragraphCount].children[j].children[k].type === 'text') {
                            data.h += paragraphs[paragraphCount].children[j].children[k].data;
                          }
                        }
                      }
                    }
                  }
                  if (!data.p.match(/\.\s[A-Z]/)) {
                    data.p = '';
                  }
                  if (data.p || data.h || data.li) {
                    bodyData.push(data);
                  }
                  console.log(data);
                }
              }
              pageObject.body = bodyData;
            }
            resolve(pageObject);
          }
          catch (error) {
            reject(error);
          }
        });
      }).on('error', error => {
        reject('Error accessing URL: ' + url);
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
      https.get(searchUrl, res => {
        let firstPageResults = '';
        res.on('data', data => {
          firstPageResults += data;
        });
        res.on('end', () => {
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
            https.get(searchUrl+pageQuery, res => {
              let randomPageResults = '';
              res.on('data', data => {
                randomPageResults += data;
              });
              res.on('end', () => {
                let results = this.getSearchLinks(randomPageResults,searchSource);
                resolve(results);
              });
            }).on('error', error => {
              reject('Error accessing random page of search results for keyword: ' + parsedKeyword);
            });
          }
          else {
            reject('Invalid results count to perform search.');
          }
        });
      }).on('error', error => {
        reject('Error accessing first page of search results for keyword: ' + parsedKeyword);
      });
    });
  }
};

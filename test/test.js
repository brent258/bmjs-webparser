const expect = require('chai').expect;
const wp = require('../index');
const fs = require('fs');

describe('web parser', function() {

  before(function() {
    wp.init();
  });

  it('should be an object with correct properties', () => {
    expect(wp).to.be.an('object');
    expect(wp).to.not.be.undefined;
  });

  it('init should create empty properties', () => {
    expect(wp.paused).to.equal(false);
    expect(wp.lastGoogleProxy).to.equal('');
    expect(wp.lastBingProxy).to.equal('');
    expect(wp.lastFlickrProxy).to.equal('');
    expect(wp.lastWebSearch).to.equal('');
    expect(wp.proxies).to.deep.equal([]);
    expect(wp.imageBlacklist).to.deep.equal([]);
    expect(wp.textBlacklist).to.deep.equal([]);
    expect(wp.textQueue).to.deep.equal({list:[], data:[]});
    expect(wp.imageQueue).to.deep.equal({list:[], data:[]});
  });

  it('add image blacklist should add blacklisted domains for image searches', () => {
    let item = /youtube/;
    wp.addImageBlacklist(item);
    expect(wp.imageBlacklist[0]).to.equal(item);
  });

  it('check image blacklist should check blacklisted domains for image searches', () => {
    expect(wp.checkImageBlacklist('youtube.com')).to.equal(true);
    expect(wp.checkImageBlacklist('google.com')).to.equal(false);
  });

  it('add text blacklist should add blacklisted domains for text searches', () => {
    let item = /google/;
    wp.addTextBlacklist(item);
    expect(wp.textBlacklist[0]).to.equal(item);
  });

  it('check text blacklist should check blacklisted domains for text searches', () => {
    expect(wp.checkTextBlacklist('youtube.com')).to.equal(false);
    expect(wp.checkTextBlacklist('google.com')).to.equal(true);
  });

  it('add proxy should append proxy to proxy list', () => {
    wp.addProxy(['1234','5678','7890']);
    expect(wp.proxies.length).to.equal(3);
  });

  it('google proxy should rotate last used item from proxy list', () => {
    expect(wp.googleProxy()).to.equal('1234');
    expect(wp.googleProxy()).to.equal('5678');
    expect(wp.googleProxy()).to.equal('7890');
    expect(wp.googleProxy()).to.equal('1234');
  });

  it('bing proxy should rotate last used item from proxy list', () => {
    expect(wp.bingProxy()).to.equal('1234');
    expect(wp.bingProxy()).to.equal('5678');
    expect(wp.bingProxy()).to.equal('7890');
    expect(wp.bingProxy()).to.equal('1234');
  });

  it('flickr proxy should rotate last used item from proxy list', () => {
    expect(wp.flickrProxy()).to.equal('1234');
    expect(wp.flickrProxy()).to.equal('5678');
    expect(wp.flickrProxy()).to.equal('7890');
    expect(wp.flickrProxy()).to.equal('1234');
  });

  it('add text queue should append item keyword and data to text queue', () => {
    let data = {name: 'Brent'};
    let keyword = 'test-keyword';
    wp.addTextQueue(data,keyword);
    expect(wp.textQueue.list.length).to.equal(1);
    expect(wp.textQueue.data.length).to.equal(1);
  });

  it('add image queue should append item keyword and data to text queue', () => {
    let data = {name: 'Brent'};
    let keyword = 'test-keyword';
    wp.addImageQueue(data,keyword);
    expect(wp.imageQueue.list.length).to.equal(1);
    expect(wp.imageQueue.data.length).to.equal(1);
  });

  it('update text queue should write keyword data to file and remove it from the queue', function(done) {
    wp.updateTextQueue('test-keyword').then(() => {
      expect(wp.textQueue.list.length).to.equal(0);
      expect(wp.textQueue.data.length).to.equal(0);
      done();
    }).catch(err => done(err));
  });

  it('update image queue should write keyword data to file and remove it from the queue', function(done) {
    wp.updateImageQueue('test-keyword').then(() => {
      expect(wp.imageQueue.list.length).to.equal(0);
      expect(wp.imageQueue.data.length).to.equal(0);
      done();
    }).catch(err => done(err));
  });

  it('create text cache should create data file for keyword', function(done) {
    wp.createTextCache('test-keyword').then(() => {
      expect(fs.existsSync('cache/data/text/test-keyword.json')).to.equal(true);
      done();
    }).catch(err => done(err));
  });

  it('create image cache should create data file and directory for keyword', function(done) {
    wp.createImageCache('test-keyword').then(() => {
      done();
    }).catch(err => done(err));
  });

  it('read text cache should return data file for keyword', function(done) {
    wp.readTextCache('test-keyword').then(data => {
      done();
    }).catch(err => done(err));
  });

  it('read image cache should return data file for keyword', function(done) {
    wp.readImageCache('test-keyword').then(data => {
      done();
    }).catch(err => done(err));
  });

  it('set assets path should set property', () => {
    wp.setAssetsPath('assets');
    expect(wp.assetsPath).to.equal('assets');
  });

  it('set cache path should set property', () => {
    wp.setCachePath('cache');
    expect(wp.cachePath).to.equal('cache');
  });

  it('object in array should detect existing objects with optional properties to ignore', () => {
    let obj = {
      name: 'Brent',
      age: 29
    };
    arr = [obj];
    expect(wp.objectInArray(obj,arr,['age'])).to.equal(true);
  });

  it('calculate image crop should return correct alignments for width and height', () => {
    expect(wp.calculateImageCrop(400,400)).to.deep.equal({h: 'HORIZONTAL_ALIGN_CENTER', v: 'VERTICAL_ALIGN_CENTER'});
  });

  it('select image from keyword should match image from title, description or filename', () => {
    let image = {
      title: 'pekingese',
      description: 'photo of pekingese',
      filename: 'pekingese-photo.jpg'
    };
    expect(wp.selectImageWithKeyword('Pekingese',image)).to.equal(true);
  });

  it('select image from tags should match image from title, description or filename and optional tags', () => {
    let image = {
      title: 'pekingese',
      description: 'photo of pekingese',
      filename: 'pekingese-photo.jpg'
    };
    expect(wp.selectImageWithTags('Pekingese',image,['cute'])).to.equal(false);
  });

  it('match url should find url text in content', () => {
    let url = 'https://amazon.com.au';
    let content = 'Buy products from Amazon';
    expect(wp.matchUrl(content,url)).to.equal(true);
  });

  it('parse text should return correctly formatted text', () => {
    let sentence = '1. This is a sentence! Here is another sentence...';
    expect(wp.parseText(sentence)).to.equal('This is a sentence!|||||Here is another sentence.');
  });

  it('parse header should return correctly formatted text', () => {
    let sentence = '1. This is a header - Here is another sentence...';
    expect(wp.parseHeader(sentence)).to.equal('This Is A Header');
  });

  it('validate text should match suitable text', () => {
    expect(wp.validateText('This is my webpage')).to.equal(false);
    expect(wp.validateText('Dog training is something you should do.')).to.equal(true);
  });

  it('validate header should match suitable text', () => {
    expect(wp.validateHeader('This is my webpage.')).to.equal(false);
    expect(wp.validateHeader('Dog training is something you should do')).to.equal(true);
  });

  it('find keyword in sentence should find correct matching words', () => {
    expect(wp.findKeywordInSentence('dog training','This is an article about training your dog.')).to.equal(true);
  });

  it('header from keyword list should return keyword if header found', () => {
    let match = wp.headerFromKeywordList('Golden Retrievers',wp.keywords.dogs);
    expect(match).to.equal('golden retriever');
  });

  it('text from keyword list should return true if keyword found', () => {
    let match = wp.textFromKeywordList('This is a post about dog breeds.',['dog breeds']);
    expect(match).to.equal(true);
  });

  it('find context from link should return true if url matches keywords', () => {
    expect(wp.findContextFromLink('tips',{url:'http://dogtraining.com/top-10-dog-training-tips', text: 'Dog training info'})).to.equal(true);
    expect(wp.findContextFromLink('tips',{url:'http://dogtraining.com/', text: 'Dog training tips'})).to.equal(false);
  });

  it('filter body content should return an array of filtered text', () => {
    let arr = wp.filterBodyContent('This is a sentence!|||||Here is another sentence.','http://mysite.com');
    expect(arr.length).to.equal(2);
  });

  it('parse image filename should remove unwanted characters', () => {
    expect(wp.parseImageFilename('%20_%567a.jpg')).to.equal('20_567a.jpg');
  });

});

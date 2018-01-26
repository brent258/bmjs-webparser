const expect = require('chai').expect;
const wp = require('../index');

describe('web parser', function() {

  before(function() {
    wp.unpause();
  });

  it('should be an object with correct properties', () => {
    expect(wp).to.be.an('object');
    expect(wp).to.have.property('imageFromKeyword');
    expect(wp).to.not.be.undefined;
  });

  it('init should create empty properties', () => {
    wp.init();
    expect(wp.downloadedImageLinks.length).to.equal(0);
    expect(wp.downloadedImageMetadata.length).to.equal(0);
  });

  it('image should be downloaded and link and metadata saved', function(done) {
    if (wp.paused) done();
    this.timeout(0);
    wp.init();
    wp.imageFromKeyword('pekingese','',true).then(message => {
        expect(wp.downloadedImageLinks[0]).to.be.a('string');
        expect(wp.downloadedImageMetadata[0]).to.be.an('object');
        expect(wp.downloadedImageMetadata[0]).to.have.property('url');
        expect(wp.downloadedImageMetadata[0]).to.have.property('image');
        expect(wp.downloadedImageMetadata[0]).to.have.property('filename');
        expect(wp.downloadedImageMetadata[0]).to.have.property('author');
        expect(wp.downloadedImageMetadata[0]).to.have.property('width');
        expect(wp.downloadedImageMetadata[0]).to.have.property('height');
        expect(wp.downloadedImageMetadata[0]).to.have.property('title');
        done();
      }
    ).catch(error => {
      done(error);
    });
  });

  it('results from keyword should correctly search for keyword and return search results (first page only)', function(done) {
    if (wp.paused) done();
    this.timeout(0);
    wp.init();
    wp.resultsFromKeyword('non shedding dogs').then(data => {
      expect(data).to.be.an('array');
      expect(data.length > 0).to.equal(true);
      done();
    })
    .catch(error => {
      done(error);
    });
  });

  it('results from keyword should correctly search for keyword and return search results (random page)', function(done) {
    if (wp.paused) done();
    this.timeout(0);
    wp.init();
    wp.resultsFromKeyword('dog bowls','bing',100).then(data => {
      expect(data).to.be.an('array');
      expect(data.length > 0).to.equal(true);
      done();
    })
    .catch(error => {
      done(error);
    });
  });

  it('get webpage object should retrieve object with webpage text properties', function(done) {
    if (wp.paused) done();
    this.timeout(0);
    wp.init();
    wp.getWebpageObject('http://www.barkbusters.com.au/').then(data => {
      expect(data).to.be.an('object');
      expect(data).to.have.property('title');
      expect(data).to.have.property('description');
      expect(data).to.have.property('keywords');
      expect(data).to.have.property('body');
      expect(data.body).to.have.property('content');
      expect(data.body).to.have.property('headers');
      expect(data.body).to.have.property('links');
      expect(data.body).to.have.property('title');
      done();
    })
    .catch(error => {
      done();
    });
  });

  it('match url should find company name in body text', () => {
    let match = wp.matchUrl('Bark Busters is a good dog training company.','http://www.barkbusters.com.au');
    expect(match).to.equal(true);
    match = wp.matchUrl('Consistency is an important tip for dog training.','http://www.barkbusters.com.au');
    expect(match).to.equal(false);
  });

  it('validate header should filter bad heading matches', () => {
    let match = wp.validateHeader('Bark Busters is a good dog training company','http://www.barkbusters.com.au');
    expect(match).to.equal(false);
    match = wp.validateHeader('You should teach your dog stuff','http://www.barkbusters.com.au/dog-training-tips');
    expect(match).to.equal(true);
    match = wp.validateHeader('I should teach my dog stuff','http://www.barkbusters.com.au');
    expect(match).to.equal(false);
    match = wp.validateHeader('You should teach your dog stuff in 2018','http://www.barkbusters.com.au');
    expect(match).to.equal(false);
  });

  it('validate text should filter bad sentence matches', () => {
    let match = wp.validateText('Bark Busters is a good dog training company.','http://www.barkbusters.com.au');
    expect(match).to.equal(false);
    match = wp.validateText('You should teach your dog stuff.','http://www.barkbusters.com.au/dog-training-tips');
    expect(match).to.equal(true);
    match = wp.validateText('I should teach my dog stuff.','http://www.barkbusters.com.au');
    expect(match).to.equal(false);
    match = wp.validateText('You should teach your dog stuff in 2018.','http://www.barkbusters.com.au');
    expect(match).to.equal(false);
  });

  it('find keyword should filter correct keyword matches in text', () => {
    let filter;
    filter = wp.findKeywordInSentence('dog training tips','A list of stuff to know.');
    expect(filter).to.equal(false);
    filter = wp.findKeywordInSentence('dog training tips','A list of tips for training.');
    expect(filter).to.equal(true);
  });

  it('parse header should remove unnecessary header components', () => {
    expect(wp.parseHeader('7. Top Tips')).to.equal('Top Tips');
    expect(wp.parseHeader('7. Top Tips - For dog training')).to.equal('Top Tips');
    expect(wp.parseHeader('7 - Top Tips: For dog training')).to.equal('Top Tips');
  });

  it('object in array should detect an object used in an array', () => {
    let obj1 = {name: 'Brent', age: 30};
    let obj2 = {name: 'Comet', age: 8};
    let obj3 = {name: 'Gizmo', age: 8};
    expect(wp.objectInArray(obj1,[obj3,obj2,obj1])).to.equal(true);
    expect(wp.objectInArray(obj1,[obj3,obj2])).to.equal(false);
  });

});

const expect = require('chai').expect;
const wp = require('../index');

describe('web parser', function() {

  before(function() {
    wp.pause();
  });

  it('should be an object with correct properties', () => {
    expect(wp).to.be.an('object');
    expect(wp).to.have.property('imageFromKeyword');
    expect(wp).to.not.be.undefined;
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

  it('get page text should retrieve text object', function(done) {
    if (wp.paused) done();
    this.timeout(0);
    wp.init();
    wp.getPageText('http://www.barkbusters.com.au/').then(data => {
      expect(data).to.be.an('object');
      done();
    })
    .catch(error => {
      done();
    });
  });

  it('init should create empty properties', () => {
    wp.init();
    expect(wp.downloadedImageLinks.length).to.equal(0);
    expect(wp.downloadedImageMetadata.length).to.equal(0);
  });

  it('make video object should construct video object from properties', function(done) {
    if (wp.paused) done();
    this.timeout(0);
    wp.init();
    let callback = function(data) {
      console.log(data);
      done();
    };
    wp.makeVideoObject(callback,'brake fast dog bowls','reviews');
  });

  it('match url should find company name in body text', () => {
    let match = wp.matchUrl('Bark Busters is a good dog training company.','http://www.barkbusters.com.au');
    expect(match).to.equal(true);
    match = wp.matchUrl('Consistency is an important tip for dog training.','http://www.barkbusters.com.au');
    expect(match).to.equal(false);
  });

  it('validate should filter bad sentence matches', () => {
    let match = wp.validateText('Bark Busters is a good dog training company.','http://www.barkbusters.com.au','dog','template');
    expect(match).to.equal(false);
    match = wp.validateText('You should teach your dog stuff.','http://www.barkbusters.com.au/dog-training-tips','dog training myths','tips');
    expect(match).to.equal(true);
    match = wp.validateText('I should teach my dog stuff.','http://www.barkbusters.com.au','dog','template');
    expect(match).to.equal(false);
    match = wp.validateText('You should teach your dog stuff in 2018.','http://www.barkbusters.com.au','dog','template');
    expect(match).to.equal(false);
  });

  it('find keyword should filter correct keyword matches in url and text', () => {
    let filter;
    filter = wp.findKeyword('dog training tips','A list of stuff to know.','http://www.barkbusters.com.au/dog%20training%20tips');
    expect(filter).to.equal(true);
    filter = wp.findKeyword('dog training tips','A list of tips for training.','http://www.barkbusters.com.au/');
    expect(filter).to.equal(true);
  });

  it('find context should filter correct keyword matches in url and text', () => {
    let filter;
    filter = wp.findKeyword('tips','A list of stuff to know.','http://www.barkbusters.com.au/dog%20training%20tips');
    expect(filter).to.equal(true);
    filter = wp.findKeyword('tips','A list of tips for training.','http://www.barkbusters.com.au/');
    expect(filter).to.equal(true);
  });

  it('parse header should remove unnecessary header components', () => {
    expect(wp.parseHeader('7. Top Tips')).to.equal('Top Tips');
    expect(wp.parseHeader('7. Top Tips - For dog training')).to.equal('Top Tips');
    expect(wp.parseHeader('7 - Top Tips: For dog training')).to.equal('Top Tips');
  });

});

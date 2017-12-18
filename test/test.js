const expect = require('chai').expect;
const wp = require('../index');

describe('web parser', function() {

  /*it('should be an object with correct properties', () => {
    expect(wp).to.be.an('object');
    expect(wp).to.have.property('imageFromKeyword');
    expect(wp).to.not.be.undefined;
  });

  it('image from keyword should filter input search terms', () => {
    expect(()=>{wp.imageFromKeyword('keywords,')}).to.throw('Invalid characters in entered keyword. Must contain only words and spaces.');
    expect(()=>{wp.imageFromKeyword('')}).to.throw('Invalid keyword entered.');
  });

  it('image should be downloaded and link and metadata saved', function(done) {
    this.timeout(0);
    wp.init();
    wp.imageFromKeyword('pekingese').then(() => {
        expect(wp.downloadedImageLinks.length).to.equal(1);
        expect(wp.downloadedImageLinks[0]).to.be.a('string');
        expect(wp.downloadedImageMetadata.length).to.equal(1);
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
    this.timeout(0);
    wp.init();
    wp.resultsFromKeyword('non shedding dogs').then(data => {
      expect(data).to.be.an('array');
      expect(data.length > 0).to.equal(true);
      done();
    })
    .catch(error => {
      done(error);
    })
  });

  it('results from keyword should correctly search for keyword and return search results (random page)', function(done) {
    this.timeout(0);
    wp.init();
    wp.resultsFromKeyword('dog bowls','bing','',100).then(data => {
      expect(data).to.be.an('array');
      expect(data.length > 0).to.equal(true);
      done();
    })
    .catch(error => {
      done(error);
    })
  });

  it('get page text should retrieve text object', function(done) {
    this.timeout(0);
    wp.init();
    wp.getPageText('http://www.barkbusters.com.au/').then(data => {
      expect(data).to.be.an('object');
      done();
    })
    .catch(error => {
      done();
    })
  });

  it('init should create empty properties', () => {
    wp.init();
    expect(wp.downloadedImageLinks.length).to.equal(0);
    expect(wp.downloadedImageMetadata.length).to.equal(0);
  });*/

  it('split stopwords should break sentences on special keywords', () => {
    wp.init();
    let check1 = wp.splitStopwords('they are good in terms of health.');
    expect(check1).to.deep.equal(['they','are','good','in_terms_of','health','.']);

  });

});

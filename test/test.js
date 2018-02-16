const expect = require('chai').expect;
const wp = require('../index');

describe('web parser', function() {

  before(function() {
    wp.unpause();
  });

  it('should be an object with correct properties', () => {
    expect(wp).to.be.an('object');
    expect(wp).to.not.be.undefined;
  });

  it('init should create empty properties', () => {
    wp.init();
  });

  it('header from keyword list should return keyword if header found', () => {
    let match = wp.headerFromKeywordList('Golden Retrievers',wp.keywords.dogs);
    expect(match).to.equal('golden retriever');
  });

  it('text from keyword list should return true if keyword found', () => {
    let match = wp.textFromKeywordList('This is a post about dog breeds.',['dog breeds']);
    expect(match).to.equal(true);
  });

});

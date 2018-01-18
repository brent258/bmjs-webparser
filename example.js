const wp = require('./index.js');

wp.getPageText('https://www.cesarsway.com/dog-training/obedience/5-essential-commands-you-can-teach-your-dog').then(data => {
  console.log(data.body.content);
})
.catch(error => {
  console.log(error);
});

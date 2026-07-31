import * as cheerio from 'cheerio';

async function test() {
  const url = 'https://hungerpost.com/restaurants/oman/1909/irani-house-restaurant-oman/';
  const urlResp = await fetch(url);
  const html = await urlResp.text();
  const $ = cheerio.load(html);
  $('script, style, noscript, iframe, img, svg').remove();
  $('br, p, div, h1, h2, h3, h4, h5, h6, li, tr, td, th, ul, ol, section, article').append('\\n');
  const visibleText = $('body').text().replace(/\\n+/g, '\\n').replace(/[ \\t]+/g, ' ').trim();
  console.log("LENGTH:", visibleText.length);
  console.log("CONTENT:\n", visibleText.substring(0, 3000));
}

test();

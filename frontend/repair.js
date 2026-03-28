const fs = require('fs');
const path = require('path');
const d = 'd:/STUDY/Coding/Projects/uron/frontend/src';

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
};

const files = walk(d);
let changed = 0;

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  let o = c;

  // Fix broken syntax from previous script:
  c = c.replace(/red-\//g, 'red-500/');
  c = c.replace(/red- /g, 'red-500 ');
  c = c.replace(/red-"/g, 'red-500"');
  c = c.replace(/red-([a-z])/ga, 'red-$1'); // oops, wait, 'red-text' doesn't mean anything. It was 'red-500[text]' ? No, if the previous string was `text-blue-200`, it became `text-red-`. We want `text-red-200`. but the original number is lost!
  // Oh no... the number is LOST!
  // I must use Git to restore the files first!!!
});

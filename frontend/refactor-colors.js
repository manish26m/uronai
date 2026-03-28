const fs = require('fs');
const path = require('path');
const d = 'd:/STUDY/Coding/Projects/uron/frontend/src';

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    let fPath = path.join(dir, file);
    const stat = fs.statSync(fPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fPath));
    } else if (fPath.endsWith('.tsx') || fPath.endsWith('.ts')) {
      results.push(fPath);
    }
  });
  return results;
};

const files = walk(d);
let changed = 0;

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  let o = c;

  c = c.replace(/blue-(\d+)/g, 'red-$1');
  c = c.replace(/purple-(\d+)/g, 'amber-$1');
  c = c.replace(/#07080f/g, '#0c0505');

  if(c !== o) {
    fs.writeFileSync(f, c);
    changed++;
    console.log('Updated colors in: ' + f);
  }
});

console.log('Total files changed: ' + changed);

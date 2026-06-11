const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
let changed = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('framer-motion')) {
    // Replace import
    let original = content;
    content = content.replace(/import\s+\{\s*([^}]*)\bmotion\b([^}]*)\s*\}\s+from\s+['"]framer-motion['"]/g, (match, p1, p2) => {
      const parts = [p1, p2].join(',').split(',').map(s => s.trim()).filter(s => s && s !== 'motion');
      parts.unshift('m');
      return `import { ${parts.join(', ')} } from 'framer-motion'`;
    });
    // Replace <motion. to <m.
    content = content.replace(/<motion\./g, '<m.');
    content = content.replace(/<\/motion\./g, '</m.');
    
    if (original !== content) {
      fs.writeFileSync(file, content);
      changed++;
    }
  }
});
console.log('Updated ' + changed + ' files for framer-motion.');

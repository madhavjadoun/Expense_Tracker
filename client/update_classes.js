const fs = require('fs');
const path = require('path');

const walk = (dir, filesList = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walk(filePath, filesList);
    } else if (filePath.endsWith('.jsx') || filePath.endsWith('.tsx') || filePath.endsWith('.js')) {
      filesList.push(filePath);
    }
  }
  return filesList;
};
const srcDir = path.join(__dirname, 'src');
const files = walk(srcDir);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Backgrounds
  content = content.replace(/bg-!\[#020617\]/g, 'bg-white dark:bg-[#020617]'); // just in case
  content = content.replace(/bg-\[\#020617\]\/([0-9]+)/g, 'bg-white/$1 dark:bg-[#020617]/$1');
  content = content.replace(/bg-\[\#020617\](?![\/])/g, 'bg-white dark:bg-[#020617]');

  // white opacity backgrounds
  content = content.replace(/(?<![:-])bg-white\/([0-9]+)/g, (match, p1) => {
    // skip if it's already dark:bg-white
    return `bg-gray-[${Math.min(100, p1 * 10)}] dark:bg-white/${p1}`; 
    // Wait, let's just use fixed scales
  });

  // Since it might be complex, let's just do it step by step
}

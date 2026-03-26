const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(path.join(__dirname, 'src'), function(filePath) {
  if (filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace single/double quote URLs (e.g. 'http://localhost:5000/api/inventory')
    let newContent = content.replace(/['"]http:\/\/localhost:5000(.*?)['"]/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}$1`");
    
    // Replace literal URLs with string interpolation already present (e.g. `http://localhost:5000/api/orders/${id}`)
    newContent = newContent.replace(/`http:\/\/localhost:5000(.*?)`/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}$1`");
    
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent);
      console.log('Updated ' + filePath);
    }
  }
});
console.log('Refactor complete!');

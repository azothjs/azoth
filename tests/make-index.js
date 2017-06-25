const fs = require('fs');
const path = require('path');

fs.readdir(__dirname, (err, files) => {
    if(err) throw err;
    const imports = files
        .filter(f => /.test.js/.test(f))
        .map(f => `import './${f}';${'\n'}`)
        .join('');
    fs.writeFile(path.join(__dirname, 'index.js'), imports, err => {
        if(err) throw err;
    });
});

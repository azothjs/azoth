const fs = require('fs');
const path = require('path');

const testFile = /.test.js$/; 
const jsFile = /.js$/;
const isTestFile = f => testFile.test(f); 
const isNotJsFile = f => !jsFile.test(f);

make(__dirname)
    .then(imports => {
        writeFile(
            path.join(__dirname, 'index.js'), 
            imports.join('')
        );
    })
    .catch(console.log);

function make(dirname, imports = []) {
    return readdir(dirname)
        .then(files => {
            imports.push(
                ...files
                    .filter(isTestFile)
                    .map(f => path.join(dirname, f))
                    .map(f => path.relative(__dirname, f))
                    .map(f => `import './${f}';${'\n'}`)
            );

            return Promise.all(
                files
                    .filter(isNotJsFile)
                    .map(f => path.join(dirname, f))
                    .map(stat)
            );
        })
        .then(files => {
            const folders = files.filter(stat => stat.isDirectory());
            return Promise.all(
                folders.map(({ filePath }) => make(filePath, imports))
            );
        })
        .then(() => imports);
}

function readdir(dirname) {
    return new Promise((resolve, reject) => {
        fs.readdir(dirname, (err, files) => {
            if(err) reject(err);
            else resolve(files);
        });
    });
}

function stat(f) {
    return new Promise((resolve, reject) => {
        fs.stat(f, (err, stat) => {
            if(err) reject(err);
            else {
                stat.filePath = f;
                resolve(stat);
            }
        });
    });
}

function writeFile(f, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(f, data, err => {
            if(err) reject(err);
            else resolve();
        });
    });
}
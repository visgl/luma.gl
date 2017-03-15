/* global require, console, module */
const fs = require('fs');
const path = require('path');
const rdr = require('recursive-readdir');
const mkdirp = require('mkdirp');

/**
 * Converts a function that accepts a node style (err, result) callback
 * as the last argument into a function that takes the same arguments
 * and returns a promise that resolves or rejects with the values provided
 * by the original callback
 * @param {Function} func - function to wrap
 * @return {Function} promisified function
 */
export function promisify(func) {
  return function promisifiedFunction(...args) {
    return new Promise((resolve, reject) => {
      function callback(error, data) {
        try {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        } catch (e) {
          reject(e);
        }
      }
      func(...args, callback);
    });
  };
}

const recursiveReaddir = promisify(rdr);
// const readFileAsync = promisify(fs.readFileAsync);

function transform(inputDir, outputDir, data) {
  if (!data) {
    console.log('Without data you are just copying files. Usage transform(inputDir, outputDir, data);');
  }

  function convert(fileName) {
    const file = fs.readFileSync(fileName);
    console.log(fileName, file.toString().slice(20));
  }

  function inputToOut(fileName) {
    return path.join(outputDir, fileName.replace(new RegExp(`^${inputDir}\/?`), ''));
  }

  function mkdirForFile(file) {
    const fileName = inputToOut(file);
    const dirs = fileName.split('/').slice(0, -1).join('/');

    mkdir(dirs, err => {
      if (err) {
        throw err;
      }
    });

    return file;
  }

  function writeFile(inputFile) {
    convert(inputFile)
      .then(function(content) {
        return [inputToOut(inputFile), content];
      })
      .spread(fs.writeFileAsync)
      .catch(function(error) {
        console.error('Write file error:', error);
      });

    return inputToOut(inputFile);
  }

  recursiveReaddir(inputDir)
    .then(fileName => {
      console.time('Transformed files in');
      return fileName;
    })
    .map(mkdirForFile)
    .map(writeFile)
    .then(function(fileName) {
      console.timeEnd('Transformed files in');
      return fileName;
    })
    .catch(console.error)
  ;
}

module.exports = transform;
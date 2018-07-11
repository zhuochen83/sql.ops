import * as fs from 'fs';
import { join } from 'path';
import * as sql from 'mssql';
import { lstatSync, readdirSync,readFileSync } from 'fs';

const opsFolder = './operations/';

const isDirectory = source => lstatSync(source).isDirectory()
const getDirectories = source =>
  readdirSync(source).map(name => join(source, name)).filter(isDirectory)

getDirectories(opsFolder).forEach(async folder => {
  const config = require('./' + join(folder, 'config.json'))
  const {user, password, server, database} = config.connection

  let pool
  try {
    console.dir('Connecting to server ' + `mssql://${user}:${password}@${server}/${database}`)
    pool = await sql.connect(`mssql://${user}:${password}@${server}/${database}`)
    readFiles(folder, (filename, content) => {
      if (filename.indexOf('.sql') > 0) {
        console.log(`Running query ${filename}`)
        runSql(content)
      }
      },
    );
  } catch(e) {
    console.error(e)
    pool && pool.close()
  }
})

const runSql = async (query) => {
  try {
    console.dir('Running query ' + query)    
      const result = await sql.query(query)
      console.dir(result)
  } catch (err) {
    console.error(err)
  }
}

function readFiles(dirname, onFileContent, onError) {
  fs.readdir(dirname, function(err, filenames) {
    if (err) {
      onError(err);
      return;
    }
    filenames.forEach(function(filename) {
      fs.readFile(join(dirname, filename), 'utf-8', function(err, content) {
        if (err) {
          onError(err);
          return;
        }
        onFileContent(filename, content);
      });
    });
  });
}



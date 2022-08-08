import { stringify} from 'csv';
import * as fs from 'fs';
import * as Stream from 'stream';

async function createCSVStreamTo(targetPath: string, columnConfig: any) {
  const csvFile = fs.createWriteStream(targetPath);
  const readbleStream = new Stream.Readable({
    objectMode: true,
    read: () => {}
  });
  
  readbleStream.pipe(stringify({
      header: true,
      objectMode: true,
      columns: columnConfig
    }))
  .pipe(csvFile);

  // todo: Add Error Handling
  return readbleStream;
}

export {
  createCSVStreamTo
};

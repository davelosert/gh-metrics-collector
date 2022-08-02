import { stringify} from 'csv';
import * as fs from 'node:fs';
import * as Stream from 'stream';

type CommitCsvRow = {
  commitDate: string;
  commitAuthor: string;
  commitSHA: string;
  repository: string;
  organisation: string
};

const columnConfig: Record<keyof CommitCsvRow, string> = {
  commitDate: 'commitDate',
  commitSHA: 'commitSHA',
  commitAuthor: 'commitAuthor',
  repository: 'repository',
  organisation: 'organisation'
}

async function createCSVStreamTo(targetPath: string) {
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

export type {
  CommitCsvRow
};

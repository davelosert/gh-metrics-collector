import { createCSVStreamTo } from './CSVOutputStream';

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

async function createCommitCSVStream(targetPath: string) {
  return createCSVStreamTo(targetPath, columnConfig);
}

export {
  createCommitCSVStream
};

export type {
  CommitCsvRow
};

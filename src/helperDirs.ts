import * as fs from 'fs';
import * as path from 'path';
import { format } from 'date-fns';

const tmpDir = path.resolve('.', 'tmp');
const gitRepoTarget = path.resolve(tmpDir, 'repos');

const HELPER_DIRS = {
  tmpDir,
  gitRepoTarget
};

interface DirHelper {
  createTmpFilePath(fileName: string): string;
};

async function createHelperDirs(): Promise<DirHelper> {
  for(const helperDirPath of Object.values(HELPER_DIRS)) {
    await fs.promises.mkdir(helperDirPath, { recursive: true });
  }
  
  return {
    createTmpFilePath: (fileName: string) => path.resolve(tmpDir, fileName),
  }
}

const dateFormat = 'yyyy-MM-dd_HH-mm-ss';
function createCommitCSVFileName() {
  const dateString = format(new Date(), dateFormat);
  return `commits_${dateString}.csv`;
}


export {
  HELPER_DIRS,
  createHelperDirs,
  createCommitCSVFileName
};

export type {
  DirHelper
};

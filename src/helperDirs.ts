import * as fs from 'fs';
import * as path from 'path';
import { format } from 'date-fns';

const outputDir = path.resolve('.', 'metrics');
const tmpDir = path.resolve('.', 'tmp')
const gitRepoTarget = path.resolve(tmpDir, 'repos');

const HELPER_DIRS = {
  outputDir,
  gitRepoTarget
};

interface DirHelper {
  createOutputFilePath(fileName: string): string;
};

async function createHelperDirs(): Promise<DirHelper> {
  for(const helperDirPath of Object.values(HELPER_DIRS)) {
    await fs.promises.mkdir(helperDirPath, { recursive: true });
  }
  
  return {
    createOutputFilePath: (fileName: string) => path.resolve(outputDir, fileName),
  }
}

async function cleanupTmpDir() {
  await fs.promises.rm(tmpDir);
};

const dateFormat = 'yyyy-MM-dd_HH-mm-ss';
function createDateCSVName(csvType: string): string {
  const dateString = format(new Date(), dateFormat);
  return `${csvType}_${dateString}.csv`;
}


export {
  HELPER_DIRS,
  createHelperDirs,
  createDateCSVName,
  cleanupTmpDir
};

export type {
  DirHelper
};

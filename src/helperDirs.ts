import * as fs from 'fs';
import * as path from 'path';


const tmpDir = path.resolve('.', 'tmp');
const gitRepoTarget = path.resolve(tmpDir, 'repos');

const HELPER_DIRS = {
  tmpDir,
  gitRepoTarget
};

async function createHelperDirs() {
  for(const helperDirPath of Object.values(HELPER_DIRS)) {
    await fs.promises.mkdir(helperDirPath, { recursive: true });
  }
  
  return {
    createTmpFilePath: (fileName: string) => path.resolve(tmpDir, fileName),
  }
}

export {
  HELPER_DIRS,
  createHelperDirs
};

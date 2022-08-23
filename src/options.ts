type Tasks = 'commits' | 'prs';
type ProgramOptions = {
  organisation: string,
  githubServer: string
  repository?: string,
  since?: string,
  until?: string,
  concurrency: number
  tasks: Tasks[];
  verbose: boolean;
};

const validateOptions = (rawOptions: any): ProgramOptions => {
  console.log(`Starting Metrics Collection with the following options:`, rawOptions);
  
  // todo: Imeplement validation
  return {
    ...rawOptions,
    concurrency: parseInt(rawOptions.concurrency)
  };
}

export {
  validateOptions
}

export type {
  ProgramOptions,
  Tasks
};

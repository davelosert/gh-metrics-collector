type ProgramOptions = {
  organisation: string,
  githubServer: string
  repository?: string,
  startDateString?: string,
  endDateString?: string,
};

const validateOptions = (rawOptions: any): ProgramOptions => {
  console.log(`Starting Metrics Collection with the following options:`, rawOptions);
  // todo: Imeplement validation
  return rawOptions;
}

export {
  validateOptions
}

export type {
  ProgramOptions
};

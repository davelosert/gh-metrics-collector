import { RepositoryIdentifier } from './Repository'

type TaskLogger = {
  log: (message: string, data?: any) => void;
  error: (message: string, error?: any) => void;
  warn: (message: string, data?: any) => void;
};

const createTaskLogger = ({ name, organisation}: RepositoryIdentifier) => {
  const prefixMessage = (message: string) => `[${organisation}/${name}]: ${message}`; 
  return {
    log: (message: string, data?: any) => {
      console.log(prefixMessage(message), data);
    },
    error: (message: string, error?: any) => {
      console.error(prefixMessage(message), error);
    },
    warn: (message: string, data?: any) => {
      console.warn(prefixMessage(message), data);
    }
  }
}

export {
  createTaskLogger
};

export type {
  TaskLogger
};

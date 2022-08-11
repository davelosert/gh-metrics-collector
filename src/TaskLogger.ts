import { RepositoryIdentifier } from './Repository'


type Logger = {
  log: (message: string, data?: any) => void;
  error: (message: string, error?: any) => void;
  warn: (message: string, data?: any) => void;
  debug: (message: string, data?: any) => void;
};


const tokensToMask: string[] = [];
const setVerboseLogging = (setting: boolean) => verbose = setting;
const addTokenToMask = (token: string) => {
  tokensToMask.push(token);
}
let verbose = false;

const maskAllTokens = (message: string): string => {
  let maskedMessage = message;
  
  tokensToMask.forEach(token => {
    maskedMessage = maskedMessage.replace(token, '<REDACTED_TOKEN>');
  });
  
  return maskedMessage;
};

const logger = {
    log: (message: string) => {
      console.log(message);
    },
    error: (message: string, error?: any) => {
      let errorMessage: string = '';

      if(error) {
        if(error instanceof Error) {
          const usedString = error.stack ? error.stack : error.message;
          errorMessage = maskAllTokens(usedString);
        } else if(typeof error === 'string') {
          errorMessage = maskAllTokens(error);
        } else if (Boolean(error.toString)) {
          errorMessage = maskAllTokens(error.toString());
        }
        // Make the error message appear in a new line
        errorMessage = `\n${errorMessage}`;
      }
      
      console.error(`${message}${errorMessage}`);
    },
    warn: (message: string) => {
      console.warn(message);
    },
    debug: (message: string) => {
      if(verbose) {
        console.log(message);
      }
    }
};


const createTaskLogger = ({ name, organisation}: RepositoryIdentifier) => {
  const prefixMessage = (message: string) => `[${organisation}/${name}]: ${message}`; 
  return {
    log: (message: string) => {
      logger.log(prefixMessage(message));
    },
    error: (message: string, error?: any) => {
      logger.error(prefixMessage(message), error);
    },
    warn: (message: string) => {
      logger.warn(prefixMessage(message));
    },
    debug: (message: string) => {
      logger.debug(prefixMessage(message));
    }
  }
}

export {
  logger,
  setVerboseLogging,
  addTokenToMask,
  createTaskLogger
};

export type {
  Logger
};

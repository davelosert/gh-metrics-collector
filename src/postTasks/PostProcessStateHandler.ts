import { logger } from '../TaskLogger';

type PostProcessState = {
  rowsHandled: number;
  rowsFiltered: number;
  scriptStartTime: [number, number];
};

const REPORT_INTERVAL = 5000;
const postProcessStateHandler = (inputCsvPath: string, outputCsvPath: string) => {
  const state: PostProcessState = {
    rowsHandled: 0,
    rowsFiltered: 0,
    scriptStartTime: process.hrtime()
  };
  
  const reportInterval = setInterval(() => {
    logger.log(`Handlded ${state.rowsHandled}.`);
  }, REPORT_INTERVAL);

  const removeInterval = () => {
    clearInterval(reportInterval);
  }

  return {
    reportTaskStart: () => {
    logger.log(`\nSTARTING POSTROCESSING PULL REQUESTS from ${inputCsvPath}`);
    logger.log('------------')
    },
    reportTaskDone: () => {
      removeInterval();
      const [ elapsedSeconds ] = process.hrtime(state.scriptStartTime);
      logger.log(`\n[Final Status] ${state.rowsFiltered}/${state.rowsHandled} Pull Requests are within the provided range in ${ elapsedSeconds } Seconds.\nThey have been written to ${outputCsvPath}`);
      logger.log('------------')
      logger.log(`PULL REQUEST POSTPROCESSING FINISHED.`);
    },
    reportRowHandled: () => {
      state.rowsHandled += 1;
    },
    reportRowFiltered: () => {
        state.rowsFiltered += 1;
    },
    reportError: (err: Error) => {
      removeInterval();
      logger.error(`Fatal Error during PullRequest Postprocessing: ${err}`);
    }
  }
};

export {
  postProcessStateHandler
};

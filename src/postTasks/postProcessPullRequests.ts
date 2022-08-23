import { DateRange } from './DateRange';
import { transform, parse, stringify } from 'csv';
import * as fs from 'fs';
import { pullRequestConfig, PullRequestCsvRow } from '../output/PullRequestCSV';
import { createRangeFilter } from './createRangeFilter';
import { logger } from '../TaskLogger';

type PRPostProcessArguments = {
  inputCsvPath: string;
  dateRange: DateRange;
  outputCsvPath: string;
};

type PostProcessState = {
  rowsHandled: number;
  rowsFiltered: number;
};

const postProcessPullRequests = ({ inputCsvPath, dateRange, outputCsvPath }: PRPostProcessArguments) => {
  return new Promise((resolve, reject) => {
    const isPRInDateRange = createRangeFilter(dateRange);
    const state: PostProcessState = {
      rowsHandled: 0,
      rowsFiltered: 0
    }

    const inputStream = fs.createReadStream(inputCsvPath);
    const outputStream = fs.createWriteStream(outputCsvPath);
    const parser = parse({ columns: true });
    const stringifier = stringify({ header: true, objectMode: true, columns: pullRequestConfig });

    const transformer = transform((record: PullRequestCsvRow) => {
      logger.debug(`Handling record ${JSON.stringify(record)}`);
      state.rowsHandled += 1;
      if(isPRInDateRange(record)) {
        state.rowsFiltered += 1;
        return record;
      }
      return null;
    }); 

    logger.log(`\nSTARTING POSTROCESSING PULL REQUESTS AT ${inputCsvPath}`);
    logger.log('------------')

    inputStream
      .pipe(parser)
      .pipe(transformer)
      .pipe(stringifier)
      .pipe(outputStream)
      .on('close', () => {
        logger.log('------------')
        logger.log(`PULL REQUEST POSTPROCESSING FINISHED.`);
        logger.log(`\n\n[Final Status] ${state.rowsFiltered}/${state.rowsHandled} Pull Requests are within the provided range.\nThey have been written to ${outputCsvPath}`);
        resolve(state);
      })
      .on('error', (err) => {
        logger.error(`Fatal Error during PullRequest Postprocessing: ${err}`);
        reject(err);
      });
  });
};


export {
  postProcessPullRequests
};

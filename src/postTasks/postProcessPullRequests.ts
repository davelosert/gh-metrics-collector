import { createRangeFilter } from './createRangeFilter';
import { DateRange } from './DateRange';
import { logger } from '../TaskLogger';
import { postProcessStateHandler } from './PostProcessStateHandler';
import { pullRequestConfig, PullRequestCsvRow } from '../output/PullRequestCSV';
import { transform, parse, stringify } from 'csv';
import * as fs from 'fs';

type PRPostProcessArguments = {
  inputCsvPath: string;
  dateRange: DateRange;
  outputCsvPath: string;
};

const postProcessPullRequests = ({dateRange,inputCsvPath, outputCsvPath}: PRPostProcessArguments) => {
  return new Promise((resolve, reject) => {
    const isPRInDateRange = createRangeFilter(dateRange);
    const stateHandler = postProcessStateHandler(inputCsvPath, outputCsvPath);

    const inputStream = fs.createReadStream(inputCsvPath);
    const outputStream = fs.createWriteStream(outputCsvPath);
    const parser = parse({ columns: true });
    const stringifier = stringify({ header: true, objectMode: true, columns: pullRequestConfig });

    const transformer = transform((record: PullRequestCsvRow) => {
      logger.debug(`Handling record ${JSON.stringify(record)}`);
      stateHandler.reportRowHandled();
      if(isPRInDateRange(record)) {
        stateHandler.reportRowFiltered();
        return record;
      }
      return null;
    }); 

    stateHandler.reportTaskStart();
    inputStream
      .pipe(parser)
      .pipe(transformer)
      .pipe(stringifier)
      .pipe(outputStream)
      .on('close', () => {
        stateHandler.reportTaskDone();
        resolve(null);
      })
      .on('error', (err) => {
        stateHandler.reportError(err);
        reject(err);
      });
  });
};


export {
  postProcessPullRequests
};

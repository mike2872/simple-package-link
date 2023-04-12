import winston from 'winston';
import { deleteFile, importConfig } from 'simple-package-link-utils';
import { spawn } from 'child_process';

const { debug } = importConfig();

deleteFile(`${process.cwd()}/.spl.log`);

let logger = null as Nullable<winston.Logger>;

if (debug) {
  logger = winston.createLogger({
    transports: [
      new winston.transports.File({
        filename: `.spl.log`,
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(log =>
            log.message.replace(
              // eslint-disable-next-line no-control-regex
              /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
              '',
            ),
          ),
        ),
      }),
    ],
  });
}

const proc = spawn('node', [`${__dirname}/_linked.js`]);

proc.stdout.on('data', function (data) {
  process.stdout.write(data);
  logger?.info(data.toString());
});

proc.stderr.on('data', function (data) {
  process.stderr.write(data);
  logger?.error(data.toString());
});

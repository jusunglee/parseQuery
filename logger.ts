import winston from 'winston';

export const defaultLogger = (level: string): winston.Logger =>
  winston.createLogger({
    level,
    format: winston.format.json(),
    transports: [
      new winston.transports.Console({
        format: winston.format.simple(),
      }),
    ],
  });

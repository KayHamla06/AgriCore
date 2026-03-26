import winston from 'winston';
import { config } from '../config';

const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'agricore-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length > 1 ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} [${level}]: ${message}${metaStr}`;
        })
      ),
    }),
  ],
});

// File transports — always log to files for audit trail
logger.add(
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 5 * 1024 * 1024, // 5MB rotation
    maxFiles: 5,
  })
);
logger.add(
  new winston.transports.File({
    filename: 'logs/combined.log',
    maxsize: 10 * 1024 * 1024, // 10MB rotation
    maxFiles: 10,
  })
);

// Security-specific log for audit trail
logger.add(
  new winston.transports.File({
    filename: 'logs/security.log',
    level: 'warn',
    maxsize: 5 * 1024 * 1024,
    maxFiles: 5,
  })
);

export default logger;

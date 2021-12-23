import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import expressWinston from "express-winston";

const dailyRotateFileOptions = {
  maxSize: process.env.LOG_MAX_SIZE || "25m",
  maxFiles: process.env.LOG_MAX_FILES || "14d",
  zippedArchive: (process.env.LOG_ZIP || "true") === "true",
  extension: ".log",
};

export const expressLogger = expressWinston.logger({
  format: format.json(),
  transports: [
    new DailyRotateFile({
      filename: "logs/express-info.%DATE%",
      level: "info",
      ...dailyRotateFileOptions,
    }),
  ],
});

export const imageLogger = createLogger({
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.align(),
    format.printf(({ level, timestamp, message }) => `${timestamp} ${level}: ${message}`),
  ),
  transports: [
    new DailyRotateFile({
      filename: "logs/image-info.%DATE%",
      level: "info",
      ...dailyRotateFileOptions,
    }),
    new transports.Console({
      level: "info",
    }),
  ],
});

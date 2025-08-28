/**
 * Logger utility
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Simple logger utility
 */
export class Logger {
  private context: string;
  
  constructor(context: string) {
    this.context = context;
  }
  
  /**
   * Log a debug message
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }
  
  /**
   * Log an info message
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }
  
  /**
   * Log a warning message
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }
  
  /**
   * Log an error message
   */
  error(message: string, error?: any): void {
    this.log(LogLevel.ERROR, message, error);
  }
  
  private log(level: LogLevel, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] [${this.context}] ${message}`;
    
    switch (level) {
      case LogLevel.ERROR:
        console.error(logMessage, data ? data : '');
        break;
      case LogLevel.WARN:
        console.warn(logMessage, data ? data : '');
        break;
      case LogLevel.INFO:
        console.info(logMessage, data ? data : '');
        break;
      case LogLevel.DEBUG:
      default:
        console.debug(logMessage, data ? data : '');
        break;
    }
  }
}

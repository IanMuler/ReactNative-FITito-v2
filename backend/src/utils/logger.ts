/**
 * Logger Utility
 * Provides structured logging for the application
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private log(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      message,
      ...(data && { data }),
    };

    const emoji = this.getEmoji(level);
    const formattedMessage = `${emoji} [${entry.timestamp}] ${level.toUpperCase()}: ${message}`;

    switch (level) {
      case 'error':
        console.error(formattedMessage, data || '');
        break;
      case 'warn':
        console.warn(formattedMessage, data || '');
        break;
      case 'debug':
        console.debug(formattedMessage, data || '');
        break;
      default:
        console.log(formattedMessage, data || '');
    }
  }

  private getEmoji(level: LogLevel): string {
    const emojiMap: Record<LogLevel, string> = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      debug: '🔍',
    };
    return emojiMap[level];
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, error?: Error | any): void {
    const errorData = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : error;
    this.log('error', message, errorData);
  }

  debug(message: string, data?: any): void {
    if (process.env['NODE_ENV'] !== 'production') {
      this.log('debug', message, data);
    }
  }

  /* HTTP Request logging */
  request(method: string, url: string, body?: any): void {
    const message = `${method} ${url}`;
    this.info(message, body && Object.keys(body).length > 0 ? body : undefined);
  }

  /* HTTP Response logging */
  response(method: string, url: string, statusCode: number, duration?: number): void {
    const level = statusCode >= 400 ? 'error' : 'info';
    const message = `${method} ${url} - ${statusCode}${duration ? ` (${duration}ms)` : ''}`;
    this.log(level, message);
  }

  /* Database query logging */
  query(query: string, params?: any[]): void {
    this.debug('Database Query', { query, params });
  }
}

export const logger = new Logger();

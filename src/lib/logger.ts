export type LogLevel = "info" | "warn" | "error";

export interface LogPayload {
  message: string;
  level: LogLevel;
  timestamp: string;
  requestId?: string;
  [key: string]: unknown;
}

class Logger {
  private formatLog(level: LogLevel, message: string, meta?: Record<string, unknown>): LogPayload {
    const payload: LogPayload = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(meta || {}),
    };
    return payload;
  }

  info(message: string, meta?: Record<string, unknown>) {
    const log = this.formatLog("info", message, meta);
    console.log(JSON.stringify(log));
  }

  warn(message: string, meta?: Record<string, unknown>) {
    const log = this.formatLog("warn", message, meta);
    console.warn(JSON.stringify(log));
  }

  error(message: string, meta?: Record<string, unknown>) {
    const log = this.formatLog("error", message, meta);
    console.error(JSON.stringify(log));
  }
}

export const logger = new Logger();

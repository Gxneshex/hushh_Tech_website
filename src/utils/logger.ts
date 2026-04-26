/**
 * Logger utility — delegates to console methods.
 * `debug` is suppressed outside Vite dev mode to keep production logs clean.
 */
const isDev: boolean = typeof import.meta !== 'undefined'
  ? (import.meta as { env?: { DEV?: boolean } }).env?.DEV === true
  : false;

export const logger = {
  log:   (...args: unknown[]) => console.log(...args),
  error: (...args: unknown[]) => console.error(...args),
  warn:  (...args: unknown[]) => console.warn(...args),
  info:  (...args: unknown[]) => console.info(...args),
  debug: (...args: unknown[]) => { if (isDev) console.debug(...args); },
};

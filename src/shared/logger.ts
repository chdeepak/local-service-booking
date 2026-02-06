export const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  error: (...args: any[]) => {
    // if first arg is an Error, print stack for easier debugging
    if (args.length && args[0] instanceof Error) {
      const err = args[0] as Error;
      console.error('[ERROR]', err.message);
      if (err.stack) console.error(err.stack);
      if (args.length > 1) console.error('[ERROR]', ...args.slice(1));
    } else {
      console.error('[ERROR]', ...args);
    }
  },
};

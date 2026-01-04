const isNeedProxy = (
  debug: boolean,
  target: Console,
  prop: string | symbol,
  proxyProps: (keyof Console)[]
) => {
  if (debug) {
    return false;
  }

  const needProxyProp = proxyProps.find((proxyProp) => proxyProp === prop);

  const originalMethod = needProxyProp ? target[needProxyProp] : undefined;

  return typeof originalMethod === 'function';
};

/**
 * get a object with logger and debug setter that can conditionally disable logging methods
 */
const useLogger = (debug: boolean, proxyProps: (keyof Console)[]) => {
  const settings = { debug };

  const setDebug = (value: boolean) => {
    settings.debug = value;
  };

  const logger = new Proxy(console, {
    get: (target, prop, receiver) => {
      // get the original method
      if (isNeedProxy(settings.debug, target, prop, proxyProps)) {
        return (..._args: unknown[]) => {
          return;
        };
      }

      return Reflect.get(target, prop, receiver);
    },
  });

  return {
    logger,
    setDebug,
  };
};

export { useLogger };

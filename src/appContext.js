let _ctx = {
  i18n: null,
  router: null,
  vue: null,
  storage: null,
};

export function setAppContext(partial) {
  _ctx = { ..._ctx, ...partial };
}

export function getAppContext() {
  return _ctx;
}

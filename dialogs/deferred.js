export default class Deferred {
  constructor() {
    this.promise = new Promise((_resolver, _rejecter) => {
      this.resolver = _resolver
      this.rejecter = _rejecter
    })
  }

  resolve(...parameters) {
    this.resolver.apply(undefined, parameters)
  }

  reject(...parameters) {
    this.rejecter.apply(undefined, parameters)
  }
}

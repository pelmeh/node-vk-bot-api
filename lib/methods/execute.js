module.exports = function (method, settings, key, callback) {
  const code = `API.${method}(${JSON.stringify(settings)})`

  this.requests[key] = {
    [code]: callback
  }
}

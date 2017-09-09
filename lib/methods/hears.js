module.exports = function (command, callback) {
  if (typeof command === 'object') {
    command.forEach((item) => {
      this.actions.hears[item.toLowerCase()] = callback
    })
  } else {
    this.actions.hears[command.toLowerCase()] = callback
  }
}

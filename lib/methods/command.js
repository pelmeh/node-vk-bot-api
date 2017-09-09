module.exports = function (command, callback) {
  if (typeof command === 'object') {
    command.forEach((item) => {
      this.actions.commands[item.toLowerCase()] = callback
    })
  } else {
    this.actions.commands[command.toLowerCase()] = callback
  }
}

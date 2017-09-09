const api = require('vk-wrapper')

module.exports = class Bot {
  constructor (settings) {
    if (!options.token) {
      throw new Error('Token not found.')
    }

    this.settings = settings
    this.requests = {}
    this.actions = { commands: {}, hears: {}, on: {} }
    this.methods = {
      execute: require('./methods/execute').bind(this),
      reply: require('./methods/reply').bind(this),
      command: require('./methods/command').bind(this),
      hears: require('./methods/hears').bind(this),
      on: require('./methods/on').bind(this),
      getLastMessage: require('./methods/getLastMessage'),
      callback: require('./methods/callback'),
      listen: require('./methods/listen').bind(this)
    }

    setInterval(() => {
      const requests = Object.keys(this.requests).map((key, i) => {
        return {
          key: Object.keys(this.requests)[i],
          api: this.requests[key]
        }
      })

      this.requests = {}

      requests.forEach((methods) => {
        if (Object.keys(methods.api).length > 25) {
          for (let i = 0, j = Math.ceil(Object.keys(methods.api).length / 25); i < j; i++) {
            api('execute', {
              code: `return [ ${Object.keys(methods.api).slice(i * 25, i * 25 + 25).join(',')} ];`,
              access_token: methods.key
            })
              .then(body => this.methods.callback(methods, body))
              .catch(err => this.methods.callback(methods, err))
          }
        } else if (Object.keys(methods.api).length) {
          api('execute', {
            code: `return [ ${Object.keys(methods.api).join(',')} ];`,
            access_token: methods.key
          })
            .then(body => this.methods.callback(methods, body))
            .catch(err => this.methods.callback(methods, err))
        }
      })
    }, 350)
  }

  execute (method, settings, key, callback) {
    return this.methods.execute(method, settings, key, callback)
  }

  reply (peer, message, attachment) {
    return this.methods.reply(peer, message, attachment)
  }

  getLastMessage (update) {
    return this.methods.getLastMessage(update)
  }

  command (command, callback) {
    return this.methods.command(command, callback)
  }

  hears (command, callback) {
    return this.methods.hears(command, callback)
  }

  on (callback) {
    return this.methods.on(callback)
  }

  listen () {
    return this.methods.listen()
  }
}

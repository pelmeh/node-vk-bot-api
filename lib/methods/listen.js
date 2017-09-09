const rp = require('request-promise')
const api = require('vk-wrapper')

module.exports = function () {
  if (!this.longPollParams) {
    return api('messages.getLongPollServer', {
      need_pts: 1,
      lp_version: 2,
      access_token: this.settings.token,
      v: 5.65
    })
      .then((body) => {
        if (!body.response || !body.response.server) {
          throw new Error(JSON.stringify(body))
        }

        this.longPollParams = body.response
        this.listen()
      })
      .catch((err) => {
        this.longPollParams = null
        return this.listen()
      })
  }

  return rp({
    url: `https://${this.longPollParams.server}?act=a_check&key=${this.longPollParams.key}&ts=${this.longPollParams.ts}&wait=25&mode=2&version=2`,
    json: true
  })
    .then((body) => {
      if (body.failed) {
        if (body.failed && body.ts) {
          this.longPollParams.ts = body.ts
        } else {
          this.longPollParams = null
        }

        return this.listen()
      }

      if (body.ts) {
        this.longPollParams.ts = body.ts
      }

      this.listen()

      if (body.updates && body.updates.length) {
        body.updates.forEach((update) => {
          if (update[0] === 4 && (update[2] & 2) === 0) {
            const ctx = {
              user_id: update[3],
              body: update[5],
              attachments: update[6],
              date: update[4],
              message_id: update[1],
            }

            if (update[6].from) {
              ctx.from = +update[6].from
            }

            const getForward = (ctx) => {
              return new Promise((resolve) => {
                if (!ctx.attachments || !ctx.attachments.fwd) {
                  resolve(null)
                }

                this.execute('messages.getById', {
                  message_ids: ctx.message_id,
                  v: 5.67
                }, this.settings.token, (data) => {
                  resolve(this.getLastMessage(data.items[0]))
                })
              })
            }

            getForward(ctx)
              .then((forward) => {
                if (forward) {
                  ctx.forward = forward
                  ctx.body = forward.body
                }

                const attachmentsKeys = Object.keys(ctx.attachments).filter(key => key.search('attach') > -1 && key.search('type') === -1 && key.search('kind') === -1)
                const attachments = []

                attachmentsKeys.forEach((key) => {
                  const file = {}

                  file['type'] = ctx.attachments[`${key}_type`]
                  file[file.type] = ctx.attachments[key]

                  attachments.push(file)
                })

                ctx.attachments = attachments
                ctx.body = ctx.body.replace(/<br>/g, '\n')

                ctx.reply = (message, attachment) => this.reply(ctx.user_id, message, attachment)
                ctx.sendMessage = (userId, message, attachment) => this.reply(ctx.user_id, message, attachment)

                const command = ctx.body.toLowerCase()

                if (this.actions.commands[command]) {
                  return this.actions.commands[command](ctx)
                }

                const method = {}

                Object.keys(this.actions.hears).forEach((command) => {
                  method[command] = this.actions.hears[command]
                })

                if (Object.keys(method).length === 0) {
                  if (typeof this.actions.on === 'function') {
                    return this.actions.on(ctx)
                  }

                  return console.error('Bot can\'t found reserved reply.')
                }

                const hears = Object.keys(method).filter((regexp) => {
                  return new RegExp(regexp, 'i').test(command)
                })

                if (hears.length !== 0) {
                  return method[hears[0]](ctx)
                }

                if (typeof this.actions.on === 'function') {
                  return this.actions.on(ctx)
                }

                return console.error('Bot can\'t found reserved reply.')
              })
              .catch((err) => {
                this.longPollParams = null
                return this.listen()
              })
          }
        })
      }
    })
    .catch((err) => {
      this.longPollParams = null
      return this.listen()
    })
}

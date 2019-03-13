const express = require('express')

const PORT = process.env['PORT'] || 8080


const app = express()
app.use(express.static('dist'))
express.static.mime.types['wasm'] = 'application/wasm'

app.get('/singleplayer', (req, res) => {
  res.sendFile('singleplayer.html', { root: './dist' })
})

app.get('/singleplayer-bot', (req, res) => {
  res.sendFile('singleplayer-bot.html', { root: './dist' })
})

app.get('/multiplayer/:gameId/:privateKey?', (req, res) => {
  res.sendFile('multiplayer.html', { root: './dist' })
})

app.listen(PORT, () => console.log(`Game server listening on ${PORT}`))


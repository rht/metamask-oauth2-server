import { fileURLToPath } from 'url';
import { dirname } from 'path';

import express from 'express'
import morgan from 'morgan'
import cors from 'cors'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express()
const port = process.env.PORT || 8080

const authCodes = new Set()
const accessTokens = new Set()
const states = new Set()
const usersMap = {}

app.use(morgan('combined'))

//app.use(express.json())

app.get('/authorize', (req, res) => {
  const query = req.query
  // query contains e.g.
  // {
  //  state: 'ZBeomm4TBq070tytQxvBQOlp6BWHVV1V',
  //  scope: 'openid email profile',
  //  response_type: 'code',
  //  approval_prompt: 'auto',
  //  redirect_uri: 'http://localhost:9352/index.php/Special:OAuth2Client/callback',
  //  client_id: ''
  //}
  if (!query.state) {
    return res.status(400).json({ message: 'Bad request' })
  }
  states.add(query.state)
  let u = new URLSearchParams(query).toString()
  res.redirect('/sign?' + u)
})

app.post('/challenge', (req, res) => {
  const query = req.query
  if (!query.address) {
    return res.send("Error: No address")
  }
  if ((!query.state) || !states.has(query.state)) {
    return res.send("Error: Invalid state")
  }
  // TODO pass in the address
  const nonce = 'eth-oauth2-' + Math.floor(Math.random() * 10_000_000).toString()
  return res.json({nonce: nonce})
})

app.post('/auth_code', express.json(), (req, res) => {
  const body = req.body
  if ((!body.state) || !states.has(body.state)) {
    return res.send("Error: Invalid state")
  }

  states.delete(body.state)

  // Generate a string of 10 random digits
  const authCode = new Array(10).fill(null).map(() => Math.floor(Math.random() * 10)).join('')

  authCodes.add(authCode)
  usersMap[authCode] = '0xAABBAAJESUS'
  const params = {
    code: authCode,
    state: body.state
  }
  return res.json(params)
  //let u = new URLSearchParams(params).toString()
  //res.redirect(body.redirect_uri + '?' + u)
})

app.post('/access_token', express.urlencoded({extended: false}), (req, res) => {
  // Generate a string of 50 random digits
  const token = new Array(50).fill(null).map(() => Math.floor(Math.random() * 10)).join('')
  usersMap[token] = usersMap[req.body.code]
  delete usersMap[req.body.code]
  authCodes.delete(req.body.code)
  accessTokens.add(token)
  return res.json({access_token: token})
})

app.get('/user', (req, res) => {
  const authorization = req.get('authorization').split(' ')[1]
  console.log("!!!", authorization)
  if (!accessTokens.has(authorization)) {
    return res.status(403).json({ message: 'Unauthorized' })
  }
  console.log(usersMap)
  return res.json({username: usersMap[authorization]})
})

app.get('/sign', (req, res) => {
  res.sendFile('index.html', { root: __dirname })
})

app.get('/authorize.js', (req, res) => {
  res.sendFile('authorize.js', { root: __dirname })
})

app.listen(port)

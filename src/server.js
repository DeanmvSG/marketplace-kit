const express = require('express')
const app = express()
const port = 3000

app.get('/:host/sync', (request, response) => {
  response.send(request.params)
})

app.listen(port, (err) => {
  if (err) {
    return console.log('something wrong happened', err)
  }

  console.log(`server is listening on ${port}`)
})

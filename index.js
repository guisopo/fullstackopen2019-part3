const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const cors = require('cors')
const Contact = require('mongo')
const app = express()
app.use(bodyParser.json())
app.use(cors())
app.use(express.static('build'))

let persons = [
  {
    id: 1,
    name: "Guillermo",
    phone: "1234567"
  },
  {
    id: 2,
    name: "Paco",
    phone: "1234567"
  },
  {
    id: 3,
    name: "Pablo",
    phone: "5435344"
  },
  {
    id: 4,
    name: "María",
    phone: "5432453"
  },
  {
    id: 5,
    name: "Sara",
    phone: "25345435"
  }
]

//============
// MIDDLEWARE

const loggerFormat = ':method :url :status :res[content-length] - :response-time ms :person'

morgan.token('person', function getInfo(req,res) {
  if(req.method === 'POST') {
    return JSON.stringify(req.body)
  }
  return ' ';
})

app.use(morgan(loggerFormat, {
  skip: 
  function (req, res) {
      return res.statusCode < 400
  },
  stream: process.stderr
}));

app.use(morgan(loggerFormat, {
  skip: 
  function (req, res) {
      return res.statusCode >= 400
  },
  stream: process.stdout
}));

//=========
// HELPERS

const generateRandomId = () => {
  const randomId = Math.ceil(Math.random() * 1000)
  if (persons.find(p => p.id === randomId)) {
    return generateRandomId()
  } else {
    return randomId
  }
}

//==========
// REST API

app.get('/', (req, res) => {
  res.send('<h1>Contact List</h1>')
})

app.get('/info', (req, res) => {
  res.send(`
    <p>Phonebook has info for ${persons.length} people</p>
    <p>${new Date()}</p>
  `)
})

app.get('/api/persons', (req, res) => {
  res.json(persons)
})

app.get('/api/persons/:id', (req, res) => {
  const id = Number(req.params.id)
  const person = persons.find(p => p.id === id)
  if(person) {
    res.json(person)
  } else {
    res.status(400).end()
  }
})

app.post('/api/persons', (req, res) => {
  const body = req.body

  if(!body.name) {
    if(!body.phone) {
      return res.status(400).json({
        error: 'Name and phone missing.'
      })
    }
    return res.status(400).json({
      error: 'Name missing.'
    })
  }

  if(!body.phone) {
    return res.status(400).json({
      error: 'Phone missing.'
    })
  }

  if (persons.find(p => p.name === body.name)) {
    return res.status(409).json({
      error: 'Name already taken. Must be unique.'
    })
  }

  const person = {
    id : generateRandomId(),
    name: body.name,
    phone: body.phone
  }

  persons.concat(person)

  res.json(person)
})

app.delete('/api/persons/:id', (req, res) => {
  const id = Number(req.params.id)
  persons = persons.filter(p => p.id !== id)
  res.status(204).end()
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
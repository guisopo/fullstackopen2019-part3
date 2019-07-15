require('dotenv').config()

const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const cors = require('cors')
const app = express()
const Contact = require('./models/contact')

app.use(bodyParser.json())
app.use(cors())
app.use(express.static('build'))

//==================
// MORGAN MIDDLEWARE

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
  Contact.find({}).then(contacts => {
    res.json(contacts.map(contact => contact.toJSON()))
  })
})

app.get('/api/persons/:id', (req, res) => {
  Contact.findById(req.params.id)
    .then(contact => {
      if(contact) {
        res.json(contact.toJSON())
      } else {
        res.status(204).end()
      }
    })
    .catch(error => next(error))
})

app.post('/api/persons', (req, res) => {
  const body = req.body

  const person = new Contact({
    name: body.name,
    number: body.number
  })

  person.save()
    .then(savedPerson => {
      res.json(savedPerson.toJSON())
    })
    .catch(error => next(error))
})

app.put('/api/persons/:id', (req, res, next) => {
  const body = req.body;
  const person = {
    name: body.name,
    number: body.number
  }
  Contact.findByIdAndUpdate(req.params.id, person, { new: true })
    .then(updatedPerson => {
      res.json(updatedPerson.toJSON)
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (req, res, next) => {
  Contact.findByIdAndRemove(req.params.id)
    .then(() => {
      res.status(204).end()
    })
    .catch(error => next(error))
})

//==============
// ERROR HANDLER

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  if (error.name === 'CastError' && error.kind === 'ObjectId') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }
  next(error)
}

app.use(errorHandler)

//==============
// PORT LISTENER

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
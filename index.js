require('dotenv').config()

const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const cors = require('cors')
const app = express()
const Contact = require( './models/contact' )

// Order matters
app.use(bodyParser.json())
app.use(cors())
app.use(express.static('build'))

//==================
// MORGAN MIDDLEWARE

const loggerFormat = ':method :url :status :res[content-length] - :response-time ms :person'

morgan.token('person', function getInfo(req) {
  if(req.method === 'POST') {
    return JSON.stringify(req.body)
  }

  return ' '
})

app.use(morgan(loggerFormat, {
  skip:
  function (req, res) {
    return res.statusCode < 400
  },
  stream: process.stderr
}))

app.use(morgan(loggerFormat, {
  skip:
  function (req, res) {
    return res.statusCode >= 400
  },
  stream: process.stdout
}))

//==========
// REST API

app.get('/', (req, res) => {
  res.send('<h1>Contact List</h1>')
})

app.get('/info', (req, res) => {
  Contact.find({})
    .then( result => {
      res.send(`
        <p>Phonebook has info for ${result.length} people</p>
        <p>${new Date()}</p>
      `)
    })
})

// Get Contact List
app.get('/api/persons', (req, res) => {
  Contact.find({})
    .then(contacts => contacts.map(contact => contact.toJSON()))
    .then(mappedContacts => res.json(mappedContacts))
})

// Get single Contact
app.get('/api/persons/:id', (req, res, next) => {
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

// Add new Contact
app.post('/api/persons', (req, res, next) => {
  const body = req.body

  const person = new Contact({
    name: body.name,
    number: body.number
  })

  person.save()
    .then(savedPerson => savedPerson.toJSON())
    .then(savedAndFormated => res.json(savedAndFormated))
    .catch(error => {
      next(error)
    })
})

// Update Contact parameters
app.put('/api/persons/:id', (req, res, next) => {
  const body = req.body

  const person = {
    name: body.name,
    number: body.number
  }

  Contact.findByIdAndUpdate(req.params.id, person, { new: true, runValidators: true, context: 'query' })
    .then(updatedPerson => updatedPerson.toJSON())
    .then(updatedAndFormated => res.json(updatedAndFormated))
    .catch(error => {
      next(error)
    })
})

// Delete Contact
app.delete('/api/persons/:id', (req, res, next) => {
  Contact.findByIdAndRemove(req.params.id)
    .then(() => res.status(204).end())
    .catch(error => {
      next(error)
    })
})

//==============
// ERROR HANDLER

const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const errorHandler = (error, req, res, next) => {
  if (error.name === 'CastError' && error.kind === 'ObjectId') {
    return res.status(400).send({ error: 'Malformatted ID' })
  }
  else if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message })
  }
  next(error)
}

app.use(errorHandler)

//==============
// PORT LISTENER

const PORT = process.env.PORT || 3002

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
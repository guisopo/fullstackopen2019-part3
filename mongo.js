const mongoose = require('mongoose')

if(process.argv.length < 3) {
  console.log('You forgot to write the password')
}

const dbName = 'phonebook'
const password = process.argv[2]

const url = `mongodb+srv://fullstack:${password}@cluster0-mtrnz.mongodb.net/${dbName}?retryWrites=true&w=majority`

mongoose.connect( url, {useNewUrlParser: true})

const contactSchema = new mongoose.Schema({
  name: String,
  phone: Number
})

const Contact = mongoose.model('Contact', contactSchema)

if(process.argv.length === 3) {
  return Contact.find({}).then(contacts => {
    console.log('phonebook:')
    contacts.forEach(contact => {
      console.log(`${contact.name} ${contact.phone}`)
    });
    mongoose.connection.close()
  })
}

const contactName = process.argv[3]
const contactPhone = process.argv[4]
const contact = new Contact({
  name: contactName,
  phone: contactPhone
})

contact.save().then(response => {
  console.log(`Added ${contactName} number ${contactPhone} to phonebook`)
  mongoose.connection.close()
})
var mongoose = require('mongoose')

var uri = 'mongodb://localhost:27017/ibotta'
var options = {
  server: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 }}
}

mongoose.connect(uri, options)

// Create a database (mongoose) instance.
var db = mongoose.connection

// Connect to the database through mongoose.
db.on('error', console.error.bind(console, 'Connection error:'))
db.once('open', function(callback) {
  console.log('db connected')
})

// Declare the Schema for the database.
// We are storing sorted anagram word : to list of words
// Example : 
// ader : [dear, read, dare]
var anagramSchema = mongoose.Schema({
  keyword: String,
  words: [String]
})

// Exports the model as an instance. 
exports.Anagram = mongoose.model('Anagram', anagramSchema)
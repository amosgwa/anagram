// Imports
var express = require('express')
var util = require('util');
var bodyParser = require('body-parser')

var db = require('./db')
var engines = require('consolidate')

var jsonParser = bodyParser.json()

var app = express()

// Set the default engine for rendering template.
app.engine('hbs', engines.handlebars)
app.set('views', './views')
app.set('view engine', 'hbs')

// Default homepage.
app.get('/', function (req, res) {
  res.render('index.hbs')
})

// Generate database from dictionary.txt.
// May take a long time based on the hard disk. Refer to server.timeout
app.get('/generate', function (req, res) {
  // Create a collection.
  console.log("Clicked generate")
  db.generateDatabase('dictionary.txt',res)
})

// This is a hack. Trying to make the 
// curl -i -X POST -d '{ "words": ["read", "dear", "dare"] }' command work.
app.use('/words.json',(req, res, next) => {
  req.headers["content-type"] = "application/json"
  next()
})

// Add the body of the words.json to the database.
app.post('/words.json', jsonParser, function (req, res) {
  // Return the words.
  var words = req.body["words"]
  console.log(words)
  db.addAnagrams(words, res)
})

// Remove all words from the database. NO TURNING BACK. :S
app.delete('/words.json', (req,res)=>{
  db.deleteAllWords(res)
})

// Retrieve the anagrams of a given word.
// The limit query from url can present or not.
app.get('/anagrams/:word.json', (req, res)=>{
  var word = req.params.word.trim()
  var limit = req.query["limit"]
  db.getAnagrams(word, limit, res)
})

// Delete a particuar word from the database.
app.delete('/words/:word.json', (req,res)=>{
  var word = req.params.word.trim()
  db.deleteWord(word,res)
})

// Run the app on port 3000.
var server = app.listen(3000, function () {
  console.log('Server running at http://localhost:' + server.address().port)
})
// This is required for generating the database from dictionary.txt.
// The ingestion takes about 5~6 mins depending on the type of hard-drive.
// The default is 2 mins, and the browser will retry after the set timout.
server.timeout = 600000
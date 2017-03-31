// Imports
var express = require('express')
var bodyParser = require('body-parser')

var db = require('./db')
var engines = require('consolidate')

var jsonParser = bodyParser.json()

var app = express()

app.use(express.static('public'))

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
  console.log("Rebuilding from dictionary.")
  //setTimeout(function(){res.send("DONE")},3000);  
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
  // Clean up the data.
  words = words.map((v) => v.trim())
  // Need at least one word.
  if(words.length > 0) {
    db.addAnagrams(words, res)
  } else {
    res.status(400).send({err:"Need at least one word."})
  }  
})

// This is a hack. Trying to make the 
// curl -i -X POST -d '{ "words": ["read", "dear", "dare"] }' command work.
app.use('/check.json',(req, res, next) => {
  req.headers["content-type"] = "application/json"
  next()
})

// Check if the words are anagrams of themselves.
app.post('/check.json', jsonParser, function (req, res) {
  var words = req.body["words"]
  var sorted_words = words.map((v)=> v.trim().split("").sort().join('').toLowerCase())

  if(sorted_words.length > 1) {
    var are_anagrams = sorted_words.every((v) => v === sorted_words[0])
    res.status(200).send({"are_anagrams": are_anagrams})
  } else {
    res.status(400).send({"err":"Needs more than one word."})
  }
})

// Remove all words from the database. NO TURNING BACK. :S
app.delete('/words.json', (req,res)=>{
  db.deleteAllWords(res)
})

// Retrieve the anagrams of a given word.
// This will NOT fail if no anagram is found.
// The limit query from url can present or not.
app.get('/anagrams/:word.json', (req, res)=>{
  // Clean up the data.
  var word = req.params.word.trim()
  var limit = req.query["limit"] || ''
  
  var filter_proper = req.query["filter_proper"] || 'false' // This is either true or false(string)
  console.log(limit, filter_proper)
  db.findAnagrams(word, limit, filter_proper, res)
})

// Delete a particular word from the database.
app.delete('/words/:word.json', (req,res)=>{
  // Clean up the data.
  var word = req.params.word.trim()
  var delete_self_anagrams = req.query["delete_self_anagrams"] || 'false' // This is either true or false(string)
  db.deleteWord(word, delete_self_anagrams, res)
})

// Returns count of words in the corpus and min/max/median/average word length.
app.get('/anagrams/stats', (req,res) => {
  db.getStats(res)
})

// Find the anagram with more than the specified size.
// Returns the words with most anagrams if no size is specified.
app.get('/anagrams/larger', (req,res) => {
  var anagram_size = req.query["anagram_size"] || ''
  db.getAnagrams(anagram_size, res)
})

// Run the app on port 3000.
var server = app.listen(3000, function () {
  console.log('Server running at http://localhost:' + server.address().port)
})
// This is required for generating the database from dictionary.txt.
// The ingestion takes about 5~6 mins depending on the type of hard-drive.
// The default is 2 mins, and the browser will retry after the set timout.
server.timeout = 600000
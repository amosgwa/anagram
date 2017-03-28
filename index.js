// Imports
var express = require('express')
var app = express()
var util = require('util');
var Promise = require('promise');
var createTimer = require('unitimer')

var fs = require('fs')
var engines = require('consolidate')

// Database instance.
var Anagram = require('./db').Anagram

// Set the default engine for rendering template.
app.engine('hbs', engines.handlebars)
app.set('views', './views')
app.set('view engine', 'hbs')

// Default homepage.
app.get('/', function (req, res) {
  res.render('index.hbs')
})

app.get('/generate', function (req, res) {
  // Create a collection.
  var anagram = new Anagram({
    keyword: 'read',
    words: ['dare', 'dear']
  });

  // anagram
  //   .save()
  //   .then(rec => res.send(rec))
  //   .catch(err => res.send(err))
  

  // var readable = fs.createReadStream('dictionary_short.txt')
  // readable
  //   .pipe(addAnagram)
  //   .pipe(res)
})

var fileStream = fs.createReadStream('dictionary.txt', {encoding: 'utf8'});
// var outStream = fs.createWriteStream('log.txt', {flags: 'a'})
// var logStdout = process.stdout

// console.log = function(d) { //
//   outStream.write(util.format(d) + '\n');
//   logStdout.write(util.format(d) + '\n');
// };

// console.error = console.log;

var prev = {}
var buffer = ''

var batch_bulkCommands = []

var timer = createTimer().start()

fileStream.on('data', function(d){
  //console.log(word)
  buffer += d.toString()
  processData()
})

fileStream.on('end', function(){
  // Bulk write to the mongo.
  console.log("Writing to mongo")
  Promise.all(batch_bulkCommands)
    .then(_=>{
      console.log("Data successfully imported.")
      console.log("Time :", timer.stop(), "ms")
    })
    .catch(err=>{
      console.log(err)
    })
})

function processData() {
  var pos;
  var batch_command = []
  // Keep going util a new line.
  while((pos = buffer.indexOf('\n')) >= 0) {
    if(pos == 0) {
      buf = buf.slice(1)
      continue
    }
    batch_command.push(processLine(buffer.slice(0, pos)))
    buffer = buffer.slice(pos+1)
  }

  batch_bulkCommands.push(Anagram.bulkWrite(batch_command))
}


function processLine(line) {
  let word = line.trim()
  // console.log("word " + word)
  let sorted = word.split('').sort().join('')

  var command = {}

  if(prev[sorted]) {
    command = {
      updateOne: {
        filter: {
          keyword: sorted
        },
        update: {
          $push: {
            words: word
          }
        }
      }  
    }
  } else {
    command = {
      insertOne: {
        document: {
          keyword: sorted,
          words: word
        }
      }
    } 

    prev[sorted] = true
  }

  return command
}

app.get('/words', function(req, res){
  // Return the words.
  Anagram.find({})
    .then(recs=> res.send(recs))
    .catch(err=> {
      console.error(err) || res.send(err)
    })
})

app.delete('/words', function(req, res){
  Anagram.remove({})
    .then(_=> res.send('Deletion Success'))
    .catch(err=> res.send(err))
})

function addAnagram(word){
  console.log(word)
}

var server = app.listen(3000, function () {
  console.log('Server running at http://localhost:' + server.address().port)
})
// Imports
var express = require('express')
var app = express()
var util = require('util');


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

var fileStream = fs.createReadStream('dictionary_short.txt', {encoding: 'utf8'});
var outStream = fs.createWriteStream('log.txt', {flags: 'a'})
var logStdout = process.stdout

console.log = function(d) { //
  outStream.write(util.format(d) + '\n');
  logStdout.write(util.format(d) + '\n');
};

console.error = console.log;

var prev = {}
var buffer = ''

fileStream.on('data', function(d){
  //console.log(word)
  buffer += d.toString()
  processData()
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

  // Bulk write to the mongo.
  console.log("Writing to mongo")
  Anagram
    .bulkWrite(batch_command)
    .then(doc=>{
      console.log(doc)
    })
    .catch(err=>{
      //console.log(err)
    })    
}



// var bulk_command = []

// var write = {
//   insertOne: {
//     document: {
//       keyword: "ader",
//       words: ['read','dear','dare']
//     }
//   }
// }

// var update = {
//   updateOne: {
//     filter: {
//       keyword: "ader"
//     },
//     update: {
//       $push: {
//         words: "hello"
//       }
//     }
//   }  
// }

// bulk_command.push(write)
// bulk_command.push(update)

// Anagram.bulkWrite(bulk_command)

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

  console.log(command)

  return command


  // if(prev.sorted) {
  //   // Add the new word to the existing anagram.
  //   Anagram
  //     .update({
  //       keyword : sorted,
  //       $push : {
  //         words : word
  //       }
  //     })
  //     .then(_=>{
  //       console.log("Existed "+sorted)
  //     })
  //     .catch(err=>{
  //       console.log(err)
  //     })
  // } else {
  //   // Add a new anagram. 
  //   let anagram_draft = new Anagram({
  //     keyword: sorted,
  //     words : [word]
  //   })
  //   anagram_draft.save()
  //     .then(_=>{
  //       console.log("New "+sorted)
  //       prev.sorted = true
  //     })
  //     .catch(err=> {
  //       fileStream.pause()
  //       console.log(err)
  //     })
  // }
}

// TODO: Optimize using stream.
// fs.readFile('dictionary.txt', {encoding: 'utf8'}, function (err, data) {
//   if (err) throw err

//   var _data = data.split("\n")

//   // var draft_linker = {}
//   // var anagram_draft = []
//   // Anagram.remove({})

//   _data
//     .reduce((prev, word) => {
//       let sorted = word.split('').sort().join('')

//       if(prev.sorted) {
//         // Add the new word to existing anagram.
//         // Anagram
//         //   .update({
//         //     keyword : sorted,
//         //     $push : {
//         //       words : word
//         //     }
//         //   })
//       } else {
//         // Add a new anagram. 
//         let anagram_draft = new Anagram({
//           keyword: sorted,
//           words : [word]
//         })
//         anagram_draft.save()
//         prev.sorted = true
//       }

//       return prev
//     })

//   // Generate batch of documents to be inserted into mongoDB.
//   // Check db.js for the schema.
// //   for(var i = 0; i < _data.length; i++) {
// //     var curr_word = _data[i]
// //     if(curr_word.length == 0) continue

// //     // Sort the letters for anagram.
// //     var sorted_word = curr_word.split('').sort().join('')

// //     if(sorted_word in draft_linker) {
// //       var idx = draft_linker[sorted_word]
// //       anagram_draft[idx].words.push(curr_word)
// //     } else {
// //       var schema = {
// //         "keyword" : sorted_word,
// //         "words" : [curr_word]
// //       }
// //       anagram_draft.push(schema)
// //       draft_linker[sorted_word] = anagram_draft.length - 1
// //     }
// //   }

// // //  console.dir(anagram_draft[draft_linker["ader"]])

// //   Anagram.insertMany(anagram_draft, function(err, doc){
// //       console.dir("Success")
// //       console.dir(doc)
// //   })

//   // var keywords = _data.map(v=> {
//   //   var obj = {
//   //     keyword: v.split('').sort().join('')
//   //     words: []
//   //   }
    
//   // })

//   //console.log(keywords)
// })

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
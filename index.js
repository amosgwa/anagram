// Imports
var express = require('express')
var app = express()
var util = require('util');
var sqlite3 = require('sqlite3').verbose();
var sql_db = new sqlite3.Database('db.sql');  

// var createTimer = require('unitimer')

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

app.put('/generate', function (req, res) {
  // Create a collection.
  console.log("Clicked generate")
})

// var outStream = fs.createWriteStream('log.txt', {flags: 'a'})
// var logStdout = process.stdout

// console.log = function(d) { //
//   outStream.write(util.format(d) + '\n');
//   logStdout.write(util.format(d) + '\n');
// };

// console.error = console.log;

// Reset the database.
Anagram.remove({})
  .then(_=> {
    console.log("Database is reset.")
    //generateDatabase()
  })

generateDatabase()

function generateDatabase() {
  //var timer = createTimer().start()
  var fileStream = fs.createReadStream('dictionary.txt', {encoding: 'utf8'});
  var buffer = ''

  var prev = {}

  console.log("Generating database from dictionary.txt")

  var batch_bulkCommands = []
  
  create_table()
  // Stream the file.
  fileStream.on('data', function(d){
    //console.log("Reading file...")
    buffer += d.toString()
    processData()
  })
  // Bulk write to the mongodb.
  fileStream.on('end', function(){
    console.log("Done Reading")
    // sql_db.close();
    // Promise.all(batch_bulkCommands)
    //   .then(_=>{
    //     console.log("Data successfully imported.")
    //     console.log("Time :", timer.stop(), "ms")
    //   })
    //   .catch(err=>{
    //     console.log(err)
    //   })
  })
  
  function processData() {
    var pos;
    var batch_command = []

    var words = []

    // Keep going until a new line.
    while((pos = buffer.indexOf('\n')) >= 0) {
      if(pos == 0) {
        buf = buf.slice(1)
        continue
      }
      //batch_command.push(processLine(buffer.slice(0, pos)))
      words.push(buffer.slice(0, pos).trim())
      buffer = buffer.slice(pos+1)
    }
    //ASK HANSEL : How do I execute only at the promise. Not here.
    //batch_bulkCommands.push(Anagram.bulkWrite(batch_command))
    // Anagram.bulkWrite(batch_command)
    //   .then()
    //   .catch(err=>{
    //     console.log(err)
    //     res.send("error")
    //   })
    sql_db_run(words)
  }
  // Create command for each word.
  function processLine(line) {
    let word = line.trim()
    console.log(word)
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
            words: [word]
          }
        }
      } 
      prev[sorted] = true
    }

    command = {
        updateOne: {
          filter: {
            keyword: sorted
          },
          update: {
            $push: {
              words: word
            }
          },
          upsert: true  
        }
      }

    if(sorted == "aber" || sorted == "ader" || word == "Zyzzogeton") {
      //console.log(word, prev[sorted])
      //console.log(command)
    }
    return command
  }
}

function create_table() {
  sql_db.run("DROP TABLE IF EXISTS anagram")
  sql_db.run("CREATE TABLE anagram (keyword TEXT, word TEXT)")
}

function sql_db_run(words) {
  sql_db.parallelize(function() {
    
    var stmt = sql_db.prepare("INSERT INTO anagram VALUES (?,?)");

    words.forEach(function(w){
      stmt.run(w.split("").sort().join(''), w)
    })
    stmt.finalize();
  });
}

function show_table() {
  sql_db.each("SELECT rowid AS id, keyword, word FROM anagram", (err, row) => {
      if(err) console.error(err)
      else console.log(row.id, row.keyword, row.word);
  });
}

// sql_db_run()


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
var fs = require('fs')
var sqlite3 = require('sqlite3').verbose();

var sql_db; // Database is closed initially.

function generateDatabase(file, res) {
  // Open database to write and create.
  // This resets the existing database.
  sql_db = new sqlite3.Database('db.sql', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, () => {
    sql_db.serialize(function () {
      sql_db.run("DROP TABLE IF EXISTS anagram")
      sql_db.run("CREATE TABLE anagram (keyword TEXT, word TEXT UNIQUE)", [], () => {
        _generateDatabaseFromFile(file, res)
      })
    });
  });
}

// Function name starting with '_' are private.
// Node's V8 engine fails without buffering because of large memory usage.
// This makes sure the engine doesn't crash.
function _generateDatabaseFromFile(file, res) {
  var fileStream = fs.createReadStream(file, {
    encoding: 'utf8'
  });
  console.log("Reading", file + "...")
  var buffer = ''
  // Stream the file.
  fileStream.on('data', function (d) {
    buffer += d.toString()
    buffer = _processData(buffer)
  })
  // Database .close is a listener on the database.
  // It will automatically be called after all execution.
  fileStream.on('end', function () {
    console.log("Done reading", file, ".")
    console.log("Importing to database...")
    sql_db.close((err, doc) => {
      if (err) {
        console.error(err)
        res.status(500).send("Error importing database.")
      }
      else {
        console.log("Finished imporrting. Database closed.")
        res.status(201).send("Import successful.")
      }
    });
  })
}

// Buffered data may include newline and fragment of a word.
// The function makes sure to take care of the fragmented word.
function _processData(buffer) {
  var pos;
  var words = []
  // Keep going until a new line.
  while ((pos = buffer.indexOf('\n')) >= 0) {
    if (pos == 0) {
      buf = buf.slice(1)
      continue
    }
    words.push(buffer.slice(0, pos).trim())
    buffer = buffer.slice(pos + 1)
  }
  // Add the list of words into the database.
  _sql_db_add_words(words)
  // Make sure to return updated buffer.
  return buffer
}

// The insertion will ignore errors if there is a dulplicate.
function _sql_db_add_words(words) {
  // Database is already opened by the parent's function call.
  sql_db.parallelize(function () {
    var stmt = sql_db.prepare("INSERT OR IGNORE INTO anagram VALUES (?,?)");
    words.forEach(function (w) {
      let sorted_word = w.split("").sort().join('').toLowerCase()
      stmt.run(sorted_word, w)
    })
    stmt.finalize();
  });
}

function getAnagrams(word, limit, res) {
  var sorted_word = word.split('').sort().join('')
  var words = []

  var query = `SELECT keyword, word FROM anagram WHERE keyword='${sorted_word}' AND word<>'${word}'`
  // Make sure that the limit is accounted.
  if (typeof limit != 'undefined') {
    query += ` LIMIT ${limit}`
  }
  console.log(query)

  // Open database.
  sql_db = new sqlite3.Database('db.sql', sqlite3.OPEN_READWRITE)
  // Append each row from result, then, the complete blocked is called to send with result.
  sql_db.each(
    query,
    (err, row) => {
      // Reading each row and append the result.
      if (err) console.error(err)
      else words.push(row.word)
    }, (err, numRows) => {
      // Completed.
      if (err) {
        console.error(err)
        res.status(500).send("Database eror at getting anagrams for " + word)
      } else {
        var result = {
          anagrams: words
        }
        console.log(result)
        res.status(200).send(result)
      }
    });
  sql_db.close()
}

function addAnagrams(words, res) {
  // Open database.
  sql_db = new sqlite3.Database('db.sql', sqlite3.OPEN_READWRITE)
  // Run insertion of words in parallel.
  sql_db.parallelize(function () {
    var stmt = sql_db.prepare("INSERT OR IGNORE INTO anagram VALUES (?,?)");
    words.forEach(function (w) {    
      var sorted_word = w.split("").sort().join('').toLowerCase()
      stmt.run(sorted_word, w)
    })
    stmt.finalize();
  });
  // Close database
  sql_db.close((err, doc) => {
    if (err) {
      console.error("Error importing.")
      res.status(500).send("Unable to add words.")
    } else {
      console.log("Finished imporrting. Database closed.")
      res.status(201).send("Created")
    }
  });
}

function deleteWord(word, res) {
  // Open database.
  sql_db = new sqlite3.Database('db.sql', sqlite3.OPEN_READWRITE)
  var query = `DELETE FROM anagram WHERE word='${word}'`
  console.log("Delete ", query)
  sql_db.run(query, [], (err, change) => {
      if (err) {
        console.error(err)
        res.status(500).send("Unable to delete " + word)
      } else {
        console.log("Delete "+word+" : successful")
        res.status(200).send("OK")
      }
    })
  // Close database
  sql_db.close()
}

// The insertion will ignore errors if there is a dulplicate.
function deleteAllWords(res) {
  sql_db = new sqlite3.Database('db.sql', sqlite3.OPEN_READWRITE)
  var query = `DELETE FROM anagram`  
  sql_db.run(query, [], (err, change) => {
    if (err) {
      console.error(err)
      res.status(500).send("Unable to delete all words")
    } else {
      console.log("All wrods are deleted successfully.")
      res.status(204).send("No Content")
    }
  })
}

exports.generateDatabase = generateDatabase
exports.getAnagrams = getAnagrams
exports.addAnagrams = addAnagrams
exports.deleteWord = deleteWord
exports.deleteAllWords = deleteAllWords
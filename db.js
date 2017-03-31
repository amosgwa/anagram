var fs = require('fs')
var sqlite3 = require('sqlite3').verbose();

var sql_db; // Database is closed initially.

// Database schema :
// keyword TEXT, 
// word TEXT UNIQUE, 
// word_length INTEGER, 
// is_proper INTEGER
function generateDatabase(file, res) {
  // Open database to write and create.
  // This resets the existing database.
  sql_db = new sqlite3.Database('db.sql', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, () => {
    sql_db.serialize(function () {
      sql_db.run("DROP TABLE IF EXISTS anagram")
      sql_db.run("CREATE TABLE anagram (keyword TEXT, word TEXT UNIQUE, word_length INTEGER, is_proper INTEGER)", [], () => {
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
        console.log("Finished importing. Database closed.")
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
    if (pos == 0) { // We don't want empty words.
      buf = buf.slice(1)
      continue
    }
    words.push(buffer.slice(0, pos).trim()) // Extract a word.
    buffer = buffer.slice(pos + 1) // Make sure to truncate.
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
    var stmt = sql_db.prepare("INSERT OR IGNORE INTO anagram VALUES (?,?,?,?)");
    words.forEach(function (w) {
      let sorted_word = w.toLowerCase().split("").sort().join('')
      let is_proper = (w[0] == w[0].toUpperCase()) ? 1 : 0 // Rule for proper noun : a word starting with a capital letter
      stmt.run(sorted_word, w, w.length, is_proper)
    })
    stmt.finalize();
  });
}

function findAnagrams(word, limit, filter_proper, res) {
  var sorted_word = word.split('').sort().join('')
  var words = []
  var query = `SELECT word FROM anagram WHERE keyword='${sorted_word}' AND word<>'${word}'`
  // Make sure that the proper nouns are filtered.
  if (filter_proper != 'false') {
    query += ` AND is_proper=0`
  }
  // Make sure that the limit is accounted.
  if (limit != '') {
    query += ` LIMIT ${limit}`
  }

  console.log(query)

  // Open database.
  sql_db = new sqlite3.Database('db.sql', sqlite3.OPEN_READWRITE)
  // Read each row from queried result, then, the complete blocked is called.
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
        res.status(500).send("Database error at getting anagrams for " + word)
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

// Words are trimmed. We can assume that the database doesn't contain words with trailing space.
function addAnagrams(words, res) {
  // Open database.
  sql_db = new sqlite3.Database('db.sql', sqlite3.OPEN_READWRITE)
  // Run insertion of words in parallel.
  sql_db.parallelize(function () {
    var stmt = sql_db.prepare("INSERT OR IGNORE INTO anagram VALUES (?,?,?,?)");
    words.forEach(function (w) {    
      let sorted_word = w.toLowerCase().split("").sort().join('')
      let is_proper = (w[0] == w[0].toUpperCase()) ? 1 : 0 // Rule for proper noun : a word starting with a capital letter
      stmt.run(sorted_word, w, w.length, is_proper)
    })
    stmt.finalize();
  });
  // Close database
  sql_db.close((err, doc) => {
    if (err) {
      console.error("Error importing.")
      res.status(500).send("Unable to add words.")
    } else {
      console.log("Finished importing. Database closed.")
      res.status(201).send("Created")
    }
  });
}
// Delete will always trigger success regardless of the presence 
// of the word.
function deleteWord(word, delete_self_anagrams, res) {
  // Open database.
  sql_db = new sqlite3.Database('db.sql', sqlite3.OPEN_READWRITE)
  var query = `DELETE FROM anagram WHERE word='${word}'`

  if(delete_self_anagrams == 'true'){
    let sorted_word = word.toLowerCase().split("").sort().join('')
    query = `DELETE FROM anagram WHERE keyword='${sorted_word}'`
  }

  //console.log("Delete ", query)
  sql_db.run(query, [], (err) => {
      if (err) {
        console.error(err)
        res.status(500).send("Unable to delete " + word)
      } else {
        console.log("Delete "+word+" : finished")  
        res.status(200).send("Delete "+word+" : finished")
      }
    })
  // Close database
  sql_db.close()
}

// The insertion will ignore errors if there is a duplicate.
function deleteAllWords(res) {
  sql_db = new sqlite3.Database('db.sql', sqlite3.OPEN_READWRITE)
  var query = `DELETE FROM anagram`  
  sql_db.run(query, [], (err, change) => {
    if (err) {
      console.error(err)
      res.status(500).send("Unable to delete all words")
    } else {
      console.log("All words are deleted successfully.")
      res.status(204).send("All words are deleted successfully.")
    }
  })
}

// Calculate the word count, min, max, median, and avg of word lengths.
function getStats(res) {
  var result = {
    word_count : 0,
    min : 0,
    max : 0,
    median : 0,
    avg : 0
  }
  var query = `
    SELECT COUNT(*) AS word_count, 
    MIN(word_length) AS min, 
    MAX(word_length) AS max, 
    AVG(word_length) AS avg, 
    (SELECT AVG(word_length)
    FROM (SELECT word_length
          FROM anagram
          ORDER BY word_length
          LIMIT 2 - (SELECT COUNT(*) FROM anagram) % 2    -- odd 1, even 2
          OFFSET (SELECT (COUNT(*) - 1) / 2
                  FROM anagram))) AS median
    FROM anagram;`

  // Open database.
  sql_db = new sqlite3.Database('db.sql', sqlite3.OPEN_READWRITE)
  sql_db.each(
    query,
    (err, row) => {
      // Reading each row and append the result.
      if (err) console.error(err)
      else {
        result.word_count = row.word_count
        result.min = row.min
        result.max = row.max
        result.median = row.median
        result.avg = row.avg
      }
    }, (err, numRows) => {
      // Completed.
      if (err) {
        console.error(err)
        res.status(500).send("Database error at generating stats.")
      } else {
        console.log(result)
        res.status(200).send(result)
      }
    });
  sql_db.close()
}

// This is messy. Prob can be optimized. :>
function getAnagrams(anagram_size, res) {
  var words = []
  var result = []

  var query = `
    SELECT tb1.keyword
    FROM (SELECT keyword, COUNT(word) AS word_count 
      FROM anagram
      GROUP BY keyword) AS tb1,
      (SELECT MAX(word_count) as max_count
        FROM (SELECT COUNT(word) AS word_count 
          FROM anagram
          GROUP BY keyword)
        ) AS tb2
    WHERE tb1.word_count=tb2.max_count`

  if(anagram_size != '' && anagram_size != 0) {
    query = `
    SELECT keyword
      FROM (SELECT keyword, COUNT(word) AS word_count 
        FROM anagram
        GROUP BY keyword) AS tb1
      WHERE tb1.word_count>=${anagram_size}`
  }

  // Open database.
  sql_db = new sqlite3.Database('db.sql', sqlite3.OPEN_READWRITE)
  sql_db.each(
    query,
    (err, row) => {
      // Reading each row and append the result.
      if (err) console.error(err)
      else {
        words.push(row.keyword)
      }
    }, (err, numRows) => {
      // Completed.
      if (err) {
        console.error(err)
        res.status(500).send("Database error at fetching a word with largest anagram.")
      } else {
        // We got the word with largest anagrams.
        // Now query to get anagrams for each word.
        // Run insertion of words in parallel.
        sql_db.serialize(function () {
          var stmt = sql_db.prepare(`SELECT word FROM anagram WHERE keyword=?`);
          words.forEach(function (w) {    
            var tmp = []
            stmt.each(w, (err, row) => {
              tmp.push(row.word)
            })
            result.push(tmp)
          })
          stmt.finalize();
        });
        sql_db.close((err, doc) => {
          if (err) {
            console.error(err)
            res.status(500).send("Error getting largest Anagrams")
          }
          else {
            var json_result = {
              count: result.length,
              anagrams : result
            }
            console.log(json_result)
            res.status(200).send(json_result)
          }
        });
      }
    });
}

exports.generateDatabase = generateDatabase
exports.findAnagrams = findAnagrams
exports.addAnagrams = addAnagrams
exports.deleteWord = deleteWord
exports.deleteAllWords = deleteAllWords
exports.getStats = getStats
exports.getAnagrams = getAnagrams
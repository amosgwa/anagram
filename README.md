Ibotta Dev Project (Amos Gwa)
=========

# Description
The project is to build an API that allows fast searches for [anagrams](https://en.wikipedia.org/wiki/Anagram). `dictionary.txt` is a text file containing every word in the English dictionary.

---
# Running the app
The app runs on node server, and you will need to install both [node and npm](https://docs.npmjs.com/getting-started/installing-node).

- First install the dependencies
  ```
  npm install
  ```
- Run the app
  ```
  npm start
  ```
- Testing in the broswer
  ```
  http://localhost:3000
  ```
---
# API End Points
The following are the implemented End Points

- `POST /words.json`: Takes a JSON array of English-language words and adds them to the corpus (data store).
  ```
  $ curl -i -X POST -d '{ "words": ["read", "dear", "dare"] }' http://localhost:3000/words.json
  HTTP/1.1 201 Created
  ...
  ```
- `GET /anagrams/:word.json`:
  - Returns a JSON array of English-language words that are anagrams of the word passed in the URL.
    ```
    $ curl -i http://localhost:3000/anagrams/read.json
    HTTP/1.1 200 OK
    ...
    {
      anagrams: [
        "dear",
        "dare"
      ]
    }
    ```
  - This endpoint should support an optional query param that indicates the maximum number of results to return.
    ```
    $ curl -i http://localhost:3000/anagrams/read.json?limit=1
    HTTP/1.1 200 OK
    ...
    {
      anagrams: [
        "dare"
      ]
    }
    ```
- `GET /:word.json?filter_proper=<true|false>`: Respect a query param for whether or not to include proper nouns in the list of anagrams
  ```
  $ curl -i http://localhost:3000/anagrams/read.json?filter_proper=true
  HTTP/1.1 200 OK
  ...
  {"anagrams":["dear","dare"]}

  $ curl -i http://localhost:3000/anagrams/read.json?filter_proper=false
  HTTP/1.1 200 OK
  ...
  {"anagrams":["dear","dare","Ader"]}
  ```
- `DELETE /words/:word.json`: Deletes a single word from the data store.
  ```
  $ curl -i -X DELETE http://localhost:3000/words/read.json
  HTTP/1.1 200 OK
  ...
  ```
- `DELETE /words/:word.json?delete_self_anagrams=<true|false>`: Delete a word *and all of its anagrams*
  ```
  curl -i -X DELETE http://localhost:3000/words/read.json?delete_self_anagrams=true
  HTTP/1.1 200 OK
  ...
  ```
- `DELETE /words.json`: Deletes all contents of the data store.
  ```
  $ curl -i -X DELETE http://localhost:3000/words.json
  HTTP/1.1 204 No Content
  ...
  ```
- `GET /anagrams/stats`: Returns a count of words in the corpus and min/max/median/average word length
  ```
  $ curl -i http://localhost:3000/anagrams/stats
  HTTP/1.1 200 OK
  ...
  {"word_count":3,"min":4,"max":4,"median":4,"avg":4}
  ```
- `GET /anagrams/larger`: Identifies words with the most anagrams
  ```
  $ curl -i http://localhost:3000/anagrams/larger
  HTTP/1.1 200 OK
  ...
  {"count":1,"anagrams":[["read","REad","dear","dare"]]}
  ```
- `GET /anagrams/larger?anagram_size=<number>`: Return all anagram groups of size >= *x*
  ```
  $ curl -i http://localhost:3000/anagrams/larger?anagram_size=2
  HTTP/1.1 200 OK
  ...
  {"count":2,"anagrams":[["bear","bare"],["read","REad","dear","dare"]]}  
  ```
- `POST /check.json`: Takes a set of words and returns whether or not they are all anagrams of each other
  ```
  $ curl -i -X POST -d '{ "words": ["read", "dear", "dare"] }' http://localhost:3000/check.json
  HTTP/1.1 200 OK
  ...
  {"are_anagrams":true} 
  ```

# Tests

Running the test will reset the database *`db.sql`* If you would like to test with contents from *`dictionary.txt`* on the browser `http://localhost:3000`, make sure the *db.sql* is replaced with *db_backup.sql* You can also generate the database from *dicationary.txt* by using this endpoint `GET /generate`. It may take 5 to 10 minutes depending on the speed of the computer. To run the tests you must have Ruby installed ([docs](https://www.ruby-lang.org/en/documentation/installation/)):

```{bash}
ruby anagram_test.rb
```

If you are running your server somewhere other than localhost port 3000, you can configure the test runner with configuration options described by

```{bash}
ruby anagram_test.rb -h
```

# Feedbacks

- Features you think would be useful to add to the API
  - It would be a nice feature to add an endpoint that allows to search for anagram with different length.
  - It would also be cool to get anagrams of multiple words.
- Implementation details (which data store you used, etc.)
  - I am using sqllite. I was using MongoDB, and it was a nightmare. Nodejs was yelling because it couldn't handle the size from data ingestion. Then, MongoDB was also very slow with the data ingestion. I use sqllite because I am already familiar with it, and it doesn't need its own server like MongoDB. It's definitely a plus for the scope of this project.
- Any edge cases you find while working on the project
  - There were a lot of edge cases (I should have documented when I was developing it). Some of the ones that I remember are :
    - User entering proper nouns (Do I save it lowercase or uppercase, and should it show for an anagram with all lowercase)
    - User requesting with trailing spaces for word
    - User requesting to delete a proper noun and all of its anagrams (It was not deleting properly because I was not lowercasing the word before sorting them.)
    - Running SQL commands with JavaScript is really tedious because JavaScript engine runs on one thread, and it assigns the task to another thread asynchronously. Synchronizing the result from the queries and returning the result needed extra care.
- Design overview and trade-offs you considered
  - I personally believe that mongo would have been a lot faster for searching in large data. We are dealing with a lot of strings, and I think Mongo is good for that. But, it was a pain to get it up and running. So yeah, finishing the project with less pain in timely manner is much more important here.
  - I am using Nodejs and Express because I wanted to learn something new. It took me about 12 videos on Nodejs and Express, and tons of googling. I learned a lot. It was fun!
  - I also built a web UI to run the test from the client side. I just wanted to see how it behaves from the client side. It also helped me see from the user perspective, and find bugs.
  - Some of the SQL commands are nasty. I need to learn more. :)

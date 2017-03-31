Ibotta Dev Project (Amos Gwa)
=========

# Description
The project is to build an API that allows fast searches for [anagrams](https://en.wikipedia.org/wiki/Anagram). `dictionary.txt` is a text file containing every word in the English dictionary.

---
# Running the app
- First install the dependencies
  ```
  npm install
  ```
- Run the app
  ```
  npm start
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

We have provided a suite of tests to help as you develop the API. To run the tests you must have Ruby installed ([docs](https://www.ruby-lang.org/en/documentation/installation/)):

```{bash}
ruby anagram_test.rb
```

If you are running your server somewhere other than localhost port 3000, you can configure the test runner with configuration options described by

```{bash}
ruby anagram_test.rb -h
```

# Features

Optionally, you can provide documentation that is useful to consumers and/or maintainers of the API.

Suggestions for documentation topics include:

- Features you think would be useful to add to the API
- Implementation details (which data store you used, etc.)
- Limits on the length of words that can be stored or limits on the number of results that will be returned
- Any edge cases you find while working on the project
- Design overview and trade-offs you considered
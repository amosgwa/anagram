#!/usr/bin/env ruby

require 'json'
require_relative 'anagram_client'
require 'test/unit'

# capture ARGV before TestUnit Autorunner clobbers it

class TestCases < Test::Unit::TestCase

  # runs before each test
  def setup
    @client = AnagramClient.new(ARGV)

    # add words to the dictionary
    @client.post('/words.json', nil, {"words" => ["REad", "read", "dear", "dare"] }) rescue nil
  end

  # runs after each test
  def teardown
    # delete everything
    @client.delete('/words.json') rescue nil
  end

  def test_adding_words
    res = @client.post('/words.json', nil, {"words" => [ "REad", "read", "dear", "dare"] })

    assert_equal('201', res.code, "Unexpected response code")
  end

  def test_fetching_anagrams
    #pend # delete me

    # fetch anagrams
    res = @client.get('/anagrams/read.json')

    assert_equal('200', res.code, "Unexpected response code")
    assert_not_nil(res.body)

    body = JSON.parse(res.body)

    assert_not_nil(body['anagrams'])

    expected_anagrams = %w(REad dare dear)
    assert_equal(expected_anagrams, body['anagrams'].sort)
  end

  def test_fetching_anagrams_with_limit
    #pend # delete me

    # fetch anagrams with limit
    res = @client.get('/anagrams/read.json', 'limit=1')

    assert_equal('200', res.code, "Unexpected response code")

    body = JSON.parse(res.body)

    assert_equal(1, body['anagrams'].size)
  end

  def test_fetching_anagrams_with_no_proper_noun
    # fetch anagrams with limit
    res = @client.get('/anagrams/read.json', 'filter_proper=true')

    assert_equal('200', res.code, "Unexpected response code")

    body = JSON.parse(res.body)['anagrams']
    refute_includes(body,'REad')
  end

  def test_fetch_for_word_with_no_anagrams
    #pend # delete me

    # fetch anagrams with limit
    res = @client.get('/anagrams/zyxwv.json')

    assert_equal('200', res.code, "Unexpected response code")

    body = JSON.parse(res.body)

    assert_equal(0, body['anagrams'].size)
  end

  def test_deleting_all_words
    #pend # delete me

    res = @client.delete('/words.json')

    assert_equal('204', res.code, "Unexpected response code")

    # should fetch an empty body
    res = @client.get('/anagrams/read.json')

    assert_equal('200', res.code, "Unexpected response code")

    body = JSON.parse(res.body)

    assert_equal(0, body['anagrams'].size)
  end

  def test_deleting_all_words_multiple_times
    #pend # delete me

    3.times do
      res = @client.delete('/words.json')

      assert_equal('204', res.code, "Unexpected response code")
    end

    # should fetch an empty body
    res = @client.get('/anagrams/read.json', 'limit=1')

    assert_equal('200', res.code, "Unexpected response code")

    body = JSON.parse(res.body)

    assert_equal(0, body['anagrams'].size)
  end

  def test_deleting_single_word
    #pend # delete me

    # delete the word
    res = @client.delete('/words/dear.json')

    assert_equal('200', res.code, "Unexpected response code")

    # expect it not to show up in results
    res = @client.get('/anagrams/read.json')

    assert_equal('200', res.code, "Unexpected response code")

    body = JSON.parse(res.body)

    assert_equal(['REad','dare'], body['anagrams'])
  end

  def test_deleting_single_word_and_self_anagram
    #pend # delete me

    # delete the word
    res = @client.delete('/words/dear.json?delete_self_anagrams=true')

    assert_equal('200', res.code, "Unexpected response code")

    # expect it not to show up in results
    res = @client.get('/anagrams/read.json')

    assert_equal('200', res.code, "Unexpected response code")

    body = JSON.parse(res.body)
    assert_equal(0, body['anagrams'].size)
  end

  def test_fetching_stats
    #pend # delete me
    # add more words
    res = @client.post('/words.json', nil, {"words" => ["fgedcba", "abcdefg", "gfedcba"] }) rescue nil
    assert_equal('201', res.code)

    # fetch anagrams
    res = @client.get('/anagrams/stats')

    assert_equal('200', res.code, "Unexpected response code")
    assert_not_nil(res.body)

    body = JSON.parse(res.body)

    word_count = body['word_count']
    min = body['min']
    max = body['max']
    median = body['median']
    avg = body['avg']

    assert_equal(7, word_count)
    assert_equal(4, min)
    assert_equal(7, max)
    assert_equal(4, median)
    assert_in_delta(5.3, avg, 0.03)
  end
  
  def test_get_anagram_larger
    # add more words
    res = @client.post('/words.json', nil, {"words" => ["fgedcba", "abcdefg", "gfedcba"] }) rescue nil
    assert_equal('201', res.code)

    res = @client.get('/anagrams/larger')
    assert_equal('200', res.code)
    body = JSON.parse(res.body)
    assert_equal(1, body['count'])
  end

  def test_get_anagram_larger_with_size
    # add more words
    res = @client.post('/words.json', nil, {"words" => ["fgedcba", "abcdefg", "gfedcba"] }) rescue nil
    assert_equal('201', res.code)

    res = @client.get('/anagrams/larger', 'anagram_size=2')
    assert_equal('200', res.code)
    body = JSON.parse(res.body)
    assert_equal(2, body['count'])
  end

  def test_check_anagram
    res = @client.post('/check.json', nil, { "words": ["read", "dear", "dare"] }) rescue nil
    body = JSON.parse(res.body)
    assert_equal(true, body["are_anagrams"])  

    res = @client.post('/check.json', nil, { "words": ["ead", "dear", "dare"] }) rescue nil
    body = JSON.parse(res.body)
    assert_equal(false, body["are_anagrams"])  
  end

end
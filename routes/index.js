'use strict';
var express = require('express');
var router = express.Router();
var client = require('../db');

module.exports = function makeRouterWithSockets (io) {

  // a reusable function
  function respondWithAllTweets (req, res, next){
    client.query('SELECT * FROM tweets INNER JOIN users ON tweets.userid = users.id', function (err, result) {
      if (err) return next(err);
      res.render('index', {
        title: 'Twitter.js',
        tweets: result.rows,
        showForm: true});
    });
  }

  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);

  // single-user page
  router.get('/users/:username', function(req, res, next){
    client.query('SELECT * FROM tweets INNER JOIN users ON tweets.userid = users.id WHERE users.name =$1', [req.params.username], function (err, result) {
      if (err) return next(err);
      res.render('index', {
        title: 'Twitter.js',
        tweets: result.rows,
        showForm: true,
        username: req.params.username
      });
    });
  });

  // single-tweet page
  router.get('/tweets/:id', function(req, res, next){
    client.query('SELECT * FROM tweets INNER JOIN users ON tweets.userid = users.id WHERE tweets.id =$1', [req.params.id], function (err, result) {
      if (err) return next(err);
      var tweetsWithThatId = result.rows;
      res.render('index', {
        title: 'Twitter.js',
        tweets: tweetsWithThatId // an array of only one element ;-)
      });
    });
  });

  // create a new tweet
  router.post('/tweets', function(req, res, next){
      var username = req.body.name;
      var userId;
      // check if user is in the database
      client.query('SELECT * FROM users ORDER BY id DESC', function(err, result) {
        if (err) return next(err);
        var userTable = result.rows;
        for (var i = 0; i < userTable; i++) {
          console.log('checking name');
          if (username === userTable[i].name) {
            userId = userTable[i].id;
          }
        }
        if (!userId) {
          console.log(userTable);
          userId = userTable[0].id + 1;
          client.query('INSERT INTO users (id, name) VALUES ($1, $2)', [userId, username]);
        }
        // check content for tags
        var tweetContent = req.body.content;
        var tag = tweetContent.substring(tweetContent.indexOf('#') + 1);
        client.query('INSERT INTO tweets (content, userid) VALUES ($1, $2)', [req.body.content, userId], function () {
          // add tags
          // check if tag exists
          client.query('SELECT * FROM tweets ORDER BY id DESC', function(err3, alltweets) {
            if (err3) return next(err3);
            var tweetsTable = alltweets.rows;
            var tweetId = tweetsTable[0].id;
              client.query('SELECT * FROM tags ORDER BY id DESC', function(err2, alltags) {
                if (err2) return next(err2);
                var tagId;
                  var tagsTable = alltags.rows;
                  for (var j = 0; j < tagsTable; j++) {
                    console.log('checking tag');
                    if (tag === tagsTable[j].name) {
                      tagId = tagsTable[j].id;
                    }
                  }
                  if (!tagId) {
                    console.log(tagsTable);
                    client.query('INSERT INTO tags (name, tweetId) VALUES ($1, $2)', [tag, tweetId]);
                  }
              });
            });
              console.log(userId);
              console.log('insert');
              // var newTweet = tweetBank.add(req.body.name, req.body.content);
              // io.sockets.emit('new_tweet', newTweet);
              res.redirect('/');
           });
         });
      })

  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });

  return router;
}

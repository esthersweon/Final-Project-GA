var db = require('../models');
var Post = db.Post;
var User = db.User;
var Comment = db.Comment;

// Get rid of console.logs you don't need anymore (esp. because this file is > 100 lines)

function index(req, res) {
  Comment.find({},function(err, comments) {
    if (err) res.send(err);
    res.json(comments);
  });
}

function show(req, res) {
  Post.findById(req.params.post_id, function(err, post){
    if (err) res.send(err);
    res.json(post.comments);
  });
}

// REQUIRE AUTH //
function create(req, res) {
  Post.findById(req.params.post_id,function(err,post){
    if (err) res.send(err)
    let comment = new db.Comment(req.body);
    post.comments.push(comment);
    post.save(function(err,savedPost) {
      if (err) {
        console.log('create comment error: ', err);
        res.send(err);
      }
      res.json(comment);
    });
  });
};

// REQUIRE AUTH //
function update(req, res) {
  Post.findById(req.params.post_id, function(err, post){
    if (err) res.send(err);
    if(allowedUser(post.author,req.session.passport.user)=== false){
      res.status(401).send('You are unauthorized to update comment');
      return;
    }
    console.log('=====================');
    console.log('post.comments are ', post.comments);
    console.log('params is', req.params.comment_id);
    console.log('=====================');
    let index = post.comments.findIndex(c=>{
      return c._id == req.params.comment_id;
    })
    let newComment = new db.Comment(req.body)
    post.comments[index] = newComment;
    post.save(function(err,newPost){
      if (err) res.send(err);
    });
    let comment = {
      index: index,
      content: newComment.content,
    }
    res.json(comment);
  });
}

// REQUIRE AUTH //
function destroy(req, res) {
  console.log('inside comment controller -- destroy');

  Post.findById(req.params.post_id, function(err, post){
    if (err) res.send(err);
    else {
      console.log('post author is', post.author);
      console.log('session user is', req.session.passport.user);

      if(allowedUser(post.author,req.session.passport.user)=== false){
        res.status(401).send('You are unauthorized to delete comment');
        return;
      }
      let index = post.comments.findIndex(c=>{
        return c._id == req.params.comment_id
      });
      post.comments.splice(index,1);
      post.save();
      console.log(post.comments);
      res.json(post.comments);
    }
  });
}

function allowedUser(post_author,session_user){
  User.find({username: post_author},function(err,user){
    if (err) {
      res.send(err);
    } else {
      // check if user is same as the post they want modify.
      console.log('user is', user);
      console.log('session user is', session_user);

      return user._id == session_user;
    }
  });
};

module.exports.index = index;
module.exports.show = show;
module.exports.create = create;
module.exports.update = update;
module.exports.destroy = destroy;

var express = require('express');
var router = express.Router();

router.get("/", function(req, res){
  res.sendFile("game.html", { root: "./public"});
});

/* GET home page. */


module.exports = router;

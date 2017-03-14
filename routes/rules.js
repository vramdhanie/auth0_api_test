var express = require('express');
var passport = require('passport');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();
var router = express.Router();

/* GET list of rules */
router.get('/', ensureLoggedIn, function(req, res, next) {
    res.render('rules', { title: 'Rules' });
});

module.exports = router;

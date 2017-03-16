var express = require('express');
var passport = require('passport');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();
var router = express.Router();
var request = require('request');

/* GET list of rules */
router.get('/', ensureLoggedIn, function(req, res, next) {
    var options = { method: 'POST',
        url: 'https://vramdhanie.auth0.com/oauth/token',
        headers: { 'content-type': 'application/json' },
        body:
            { grant_type: 'client_credentials',
                client_id: process.env.AUTH0_API_CLIENT_ID,
                client_secret: process.env.AUTH0_API_CLIENT_SECRET,
                audience: 'https://vramdhanie.auth0.com/api/v2/' },
        json: true };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);

        var token = body.access_token;


        var options = {
            method: 'GET',
            url: 'https://vramdhanie.auth0.com/api/v2/clients',
            headers:
                {
                    authorization: 'Bearer ' + token,
                    'content-type': 'application/json'
                },
            data: {
                fields: 'name,description,app_type,logo_uri'
            }
        };

        request(options, function (error, response, body) {
            if (error) throw new Error(error);

            var clients = body;

            var options = {
                method: 'GET',
                url: 'https://vramdhanie.auth0.com/api/v2/rules',
                headers:
                    {
                        authorization: 'Bearer ' + token,
                        'content-type': 'application/json'
                    }
            };

            request(options, function (error, response, body) {
                if (error) throw new Error(error);


                res.render('rules', { title: 'Rules', clients: clients, rules:body });
            });
        });

    });




});

module.exports = router;

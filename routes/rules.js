var express = require('express');
var passport = require('passport');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();
var router = express.Router();
var request = require('request');
var winston = require('winston');
var prism = require('prismjs');

/* GET list of rules */
router.get('/', ensureLoggedIn, function(req, res, next) {
    winston.info('GET rules invoked');
    var p = new Promise(function(resolve, reject ){
        var options = { method: 'POST',
            url: 'https://vramdhanie.auth0.com/oauth/token',
            headers: { 'content-type': 'application/json' },
            body:
                { grant_type: 'client_credentials',
                    client_id: process.env.AUTH0_API_CLIENT_ID,
                    client_secret: process.env.AUTH0_API_CLIENT_SECRET,
                    audience: 'https://vramdhanie.auth0.com/api/v2/' },
            json: true };
        winston.info('About to request access token');
        request(options, function (error, response, body) {
            if (error) throw new Error(error);
            resolve(body.access_token);
        });
    });

    p.then(function(token){

        var p2 = new Promise(function(resolve, reject){
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
            winston.info('About to request clients');
            request(options, function (error, response, body) {
                if (error) throw new Error(error);
                winston.info('Clients received: ' + body.length);
                winston.info('Type of data: ' + typeof(body));
                resolve({
                    token: token,
                    clients: JSON.parse(body)
                });
            });
        });
        return p2;

    }).then(function(data){
        winston.info('Type of data received by then: ' + typeof(data));
        var p3 = new Promise(function(resolve, reject){
            var options = {
                method: 'GET',
                url: 'https://vramdhanie.auth0.com/api/v2/rules',
                headers:
                    {
                        authorization: 'Bearer ' + data.token,
                        'content-type': 'application/json'
                    }
            };
            winston.info('About to request rules');
            request(options, function (error, response, body) {
                if (error) throw new Error(error);
                winston.info('Rules received: ' + body.length);
                data.rules = JSON.parse(body);
                resolve(data);
            });
        });
        return p3;

    }).then(function(data){
        var ruleList = {
            clients:{}
        };
        winston.info('Final data ready for processing');
        winston.info('Data Type: ' + typeof(data));
        winston.info('Type of clients: ' + typeof(data.clients));

        //highlight the script
        data.rules = data.rules.map(function(rule){
            rule.script = prism.highlight(rule.script, prism.languages.javascript);
            return rule;
        });

        for(var i = 0; i < data.clients.length; i++){
            var client = data.clients[i];
                ruleList.clients[client.name] = {
                    client: client,
                    rules: data.rules.filter(function (rule) {
                        return rule.script.indexOf(client.name) > -1;
                    }).map(function(rule){
                        if(rule.client){
                            rule.client.push(client.name);
                        }else{
                            rule.client = [client.name];
                        }
                        return rule;
                    })
                }
        }
        ruleList.all = data.rules.filter(function(rule){
            return !Boolean(rule.client);
        });

        res.render('rules', { title: 'Rules', data: ruleList, user: req.user });
    });

});

module.exports = router;

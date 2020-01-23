var express = require('express');
var bodyParser = require('body-parser');
var config = require('./config/config');
var appDao = require('./dao/AppDAO');
var app = express();

var resp = function (res, data, code, next) {
    res.status(code).json(data);
    return next();
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});


app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Origin, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.listen(config.init_port);

console.log("Application is listening on port ", config.init_port);

// REGISTER USER
app.post('/user/add', function (req, res, next) {
    var body = req.body;

    appDao.get_user(body, function (response, code) {
        if(code == 200) {
            response = {err: true, response: "Email already exists"}
            resp(res, response, 400, next)
        } else {
            appDao.add_user(body, function (response, code) {
                resp(res, response, code, next)
            })
        }
    })
});

// LOGIN
app.post('/user/login', function (req, res, next) {
    var body = req.body;
    
    appDao.get_user(body, function (response, code) {
        console.dir(code);
        if(code == 200) {
            var token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            var expire = { 
                expire: Date.now() + (2 * 60 * 1000),
                token: token
            };
            var desc = response;
            desc.data = expire;
            appDao.update_session(token, expire, function (response, code) {
                resp(res, desc, code, next)
            })
        } else {
            resp(res, response, code, next)
        }
    })
});

// GET MORTY DATA
app.post('/getdata', (req, res, next) => {
    var token = req.body.token;

    if(token == null) {
        resp(res, {err: true, response: "Invalid session", data: null}, 400, next);
    } else {
        appDao.get_token(token, function (response, code) {
            if(Number(response.data.expire) < Date.now()) {
                response = {err: true, response: "session expired"}
                resp(res, response, code, next);
            } else {
                var expire = { expire: Date.now() + (2 * 60 * 1000)};
                appDao.update_session(token, expire, function (response, code) {})
                appDao.get_user_morty(function (response, code) {
                    var data = [];
                    if(code == 200) {
                        response.data.results.forEach(character => {
                            data.push({
                                name: character.name,
                                status: character.status,
                                species: character.species,
                                gender: character.gender,
                                image: character.image
                            })
                        });
                    }
                    resp(res, data, code, next)
                })
            }
        })
    }
});
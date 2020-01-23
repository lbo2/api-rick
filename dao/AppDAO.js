var redis = require('../libraries/Redis');
var config = require('../config/config');
var request = require('request');

var AppDAO = {

    add_user: function (data, callback) {
        var email = data.email;
        var extract = {
            email: email,
            password: data.password,
        };

        redis.add_set({key: {"email": email}, data: extract}, function (resp) {
            if (resp){
                return callback({err: false, response: "Data was added successfully "}, 200);
            }else{
                return callback({err: true, response: "User was not added successfully "}, 400);
            }
        })
    },

    get_user: function (data, callback) {
        redis.get_set({"email": data.email}, null, function (resp) {
            if (resp){
                if(resp.password == data.password) {
                    return callback({err: false, response: "User found successfully", data: resp}, 200);
                } else {
                    return callback({err: true, response: "Email and password do not match", data: null}, 400);
                }
            }else{
                return callback({err: true, response: "User was not found", data: null}, 400);
            }
        })

    },

    get_user_morty: function (callback) {
        request.get(config.url_morty, (err, response, body) => {
            if (!err){
                return callback({err: false, response: "User found successfully", data: JSON.parse(body)}, 200);
            }else{
                return callback({err: true, response: "User was not found", data: null}, 400);
            }
        });

    },

    update_session: function (token, data, callback) {
        redis.add_set({key: {"token": token}, data: data}, function (resp) {
            if (resp){
                return callback({err: false, response: "User was edited successfully "}, 200);
            }else{
                return callback({err: true, response: "No user found with email"}, 400);
            }
        })
        return true;
    },

    get_token: function (token, callback) {
        redis.get_set({"token": token}, null, function (resp) {
            if (resp){
                return callback({err: false, response: "User found successfully", data: resp}, 200);
            }else{
                return callback({err: true, response: "User was not found", data: null}, 400);
            }
        })

    },

};

module.exports = AppDAO;
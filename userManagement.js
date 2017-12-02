'use strict';

const mysql = require('promise-mysql');
const config = require('./config.js').dbconfig;
const jwtsignature = require('./config.js').jwtsignature;
const hashingPassword = require('./config.js').hashingPassword;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const utils = require('./utils');

var pool;

module.exports.create = (event, context, callback) => {
    const done = utils.getOutputHelper(callback);

    createUser(JSON.parse(event.body))
    .then((rows) => {
        done(null, rows)
        closePool(pool);
    }).catch((err) => {
        done(err)
        closePool(pool);
    });
};

module.exports.verify = (event, context, callback) => {
    const done = utils.getOutputHelper(callback);
    const bodyJson = JSON.parse(event.body);
    verifyUser(bodyJson)
    .then((rows) => {
        if(rows.length == 1 && bcrypt.compareSync(`${bodyJson.emailAddress}_${bodyJson.password}`, rows[0].password)) {
            done(null, {'found': true, 'token': jwt.sign({'userId':rows[0].ID}, jwtsignature)})
        } else {
            done(null, {'found': false, 'token': ''})
        }

        closePool(pool);
    }).catch((err) => {
        done(err)
        closePool(pool);
    });
}

function verifyUser(user) {
    return getPool().query('SELECT ID, userName, password FROM users WHERE emailaddress = ?'
                ,[user.emailAddress]);
}

function createUser(user) {
    return getPool().query(
        `INSERT INTO 
        users (userName, emailaddress, password)
        VALUES (?, ?, ?)`,
        [user.name, user.emailAddress, hashPassword(user.emailAddress, user.password)]);
}

function hashPassword(emailAddress, password) {
    return bcrypt.hashSync(`${emailAddress}_${password}`, 5);
}

function getPool() {
    //if(!pool) {
        closePool(pool);
        pool  = mysql.createPool(config);
    //}

    return pool;
}

function closePool(pool) {
    try {
        pool.end(function(err) {
            if(err) { throw err; }
        });
        pool = undefined;
    } catch(e) {
    }
    
}
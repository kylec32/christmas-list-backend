'use strict';

const mysql = require('promise-mysql');
const config = require('./config.js').dbconfig;
const utils = require('./utils');

var pool;

module.exports.addItem = (event, context, callback) => {
    
    const done = utils.getOutputHelper(callback);
    let body = JSON.parse(event.body);
    body.requester = event.requestContext.authorizer.principalId;
    
    addItem(body)
    .then((success) => {
        done(null, success)
        closePool(pool);
    }).catch((err) => {
        done(err)
        closePool(pool);
    });
};

module.exports.removeItem = (event, context, callback) => {
    const done = utils.getOutputHelper(callback);

    const requester = event.requestContext.authorizer.principalId;

    deleteItem(event.pathParameters.presentId, requester)
    .then((success) => {
        done(null, success)
        closePool(pool);
    }).catch((err) => {
        done(err)
        closePool(pool);
    });
}

module.exports.updateItem = (event, context, callback) => {
    const done = utils.getOutputHelper(callback);
    const body = JSON.parse(event.body);
    const requester = event.requestContext.authorizer.principalId;

    updateItem(event.pathParameters.presentId, body, requester)
    .then((success) => {
        done(null, success)
        closePool(pool);
    }).catch((err) => {
        done(err)
        closePool(pool);
    });
}

module.exports.getItems = (event, context, callback) => {
    const done = utils.getOutputHelper(callback);
    const body = JSON.parse(event.body);

    const user = event.requestContext.authorizer.principalId;

    getPresents(user)
    .then((success) => {
        done(null, success)
        closePool(pool);
    }).catch((err) => {
        done(err)
        closePool(pool);
    });
}

function getPresents(user) {
    return getPool()
    .query(
        `SELECT ID, description, url FROM presents
        WHERE requester = ?`,
        [user]);
}

function addItem(present) {
    return getPool()
    .query(
        `INSERT INTO presents (requester, description, url) 
        VALUES (?, ?, ?)`,
        [present.requester, present.description, present.url]);
}

function deleteItem(presentId, requester) {
    return getPool()
    .query(
        `
        DELETE FROM presents WHERE ID = ? AND requester = ?
        `, [presentId, requester]
    );
}

function updateItem(presentId, present, requester) {
    return getPool()
    .query(
        `
        UPDATE presents SET description = ?, url = ?  WHERE ID = ? AND requester = ?
        `, [present.description, present.url, presentId, requester]
    );
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
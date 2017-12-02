'use strict';

const mysql = require('promise-mysql');
const config = require('./config.js').dbconfig;
const utils = require('./utils');

var pool;

module.exports.connector = (event, context, callback) => {
    
    const done = utils.getOutputHelper(callback);

    const requester = event.requestContext.authorizer.principalId;
    
    connect(requester, event.pathParameters.toConnect)
    .then((success) => {
        done(null, success)
        closePool(pool);
    }).catch((err) => {
        done(err)
        closePool(pool);
    });
};

module.exports.disconnector = (event, context, callback) => {
    
    const done = utils.getOutputHelper(callback);

    const requester = event.requestContext.authorizer.principalId;

    disconnect(requester, event.pathParameters.toConnect)
    .then((success) => {
        done(null, success)
        closePool(pool);
    }).catch((err) => {
        done(err)
        closePool(pool);
    });
};

module.exports.availableConnections = (event, context, callback) => {
    const done = utils.getOutputHelper(callback);

    const requester = event.requestContext.authorizer.principalId;

    usersToConnectTo(requester)
    .then((success) => {
        done(null, success)
        closePool(pool);
    }).catch((err) => {
        done(err)
        closePool(pool);
    });
}

module.exports.currentConnections = (event, context, callback) => {
    const requester = event.requestContext.authorizer.principalId;

    const done = utils.getOutputHelper(callback);
    currentConnections(requester)
    .then((success) => {
        done(null, success)
        closePool(pool);
    }).catch((err) => {
        done(err)
        closePool(pool);
    });
}

function currentConnections(self) {
    return getPool()
    .query(`SELECT users.ID, users.userName FROM following
    JOIN users ON users.ID = following.followee
    WHERE following.follower = ?`
    ,[self]);
}

function usersToConnectTo(self) {
    return getPool()
    .query('SELECT ID, userName FROM users WHERE ID <> ?'
    ,[self]);
}

function connect(from, toEmail) {
    return new Promise((resolve, reject) => {
        emailToId(toEmail)
        .then((to) => {
            connected(from, to)
            .then((alreadyConnected) => {
                if(alreadyConnected.connected) {
                    resolve({"connected": true});
                    return;
                }
    
                getPool().query(
                    `INSERT INTO 
                    following (follower, followee)
                    VALUES (?, ?)`,
                    [from, to])
                    .then((rows) => {
                        resolve({"connected": true});
                    })
                    .catch((error) => {
                        resolve({"connected": false});
                    });
            })
            .catch((error) => {
                console.log(error);
                reject(error);
            })
            }
        ).catch((error) => {
            reject(error);
        });
    });
}

function disconnect(from, to) {
    return getPool().query(
        `DELETE FROM
        following WHERE follower = ? AND followee = ?`,
        [from, to]);
}

function connected(from, to) {
    return new Promise((resolve, reject) => {
        getPool().query('SELECT 1 FROM following WHERE follower = ? and followee = ?'
        ,[from, to])
        .then((success) => {
            resolve({"connected": success.length == 1 ? true : false});
        }).catch((error) => {
            reject({"connected": false, "error": error});
        });
    });
}

function emailToId(email){
    return new Promise((resolve, reject) => {
        getPool().query('SELECT ID from users WHERE emailAddress = ?', [email])
        .then((id) => {
            if(id.length == 1) {
                resolve(id[0].ID);
            } else {
                reject("Not Found");
            }
        }).catch((error) => {
            reject(error);
        })
    });
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
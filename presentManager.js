'use strict';

const mysql = require('promise-mysql');
const config = require('./config.js').dbconfig;
const utils = require('./utils');

var pool;

module.exports.getOtherPresents = (event, context, callback) => {
    
    const done = utils.getOutputHelper(callback);
    const requester = event.requestContext.authorizer.principalId;
    
    getOtherPresents(requester)
    .then((success) => {
        done(null, success)
        closePool(pool);
    }).catch((err) => {
        done(err)
        closePool(pool);
    });
};

module.exports.markAsPurchased = (event, context, callback) => {
    const done = utils.getOutputHelper(callback);
    const requester = event.requestContext.authorizer.principalId;
    const id = event.pathParameters.presentId;
    
    setAsPurchased(id, requester)
    .then((success) => {
        done(null, success)
        closePool(pool);
    }).catch((err) => {
        done(err)
        closePool(pool);
    });
}

module.exports.unmarkAsPurchased = (event, context, callback) => {
    const done = utils.getOutputHelper(callback);
    const requester = event.requestContext.authorizer.principalId;
    const id = event.pathParameters.presentId;
    
    unmarkAsPurchased(id, requester)
    .then((success) => {
        done(null, success)
        closePool(pool);
    }).catch((err) => {
        done(err)
        closePool(pool);
    });
}

function unmarkAsPurchased(id, requester) {
    return new Promise((resolve, reject) => {
        purchasedBy(id, requester)
        .then(purchasedByUser => {
            if(purchasedByUser) {
                getPool()
                        .query(`UPDATE presents
                        SET purchaser = null
                        WHERE id = ?`, [id],
                        (error, results) => resolve(results));
            } else {
                reject("Forbidden");
            }
        })
        .catch(error => {
            reject(error);
        })
    });
}

function setAsPurchased(id, requester) {
    return new Promise((resolve, reject) => {
        alreadyPurchased(id)
        .then(purchased => {
            if(purchased) {
                reject("Conflict");
            } else {
                getPool()
                .query(`UPDATE presents
                        SET purchaser = ?
                        WHERE id = ?`, [requester, id],
                        function (error, results, fields) {
                            resolve(results);
                          });
            }
        })
        .catch(error => {
            reject(error);
        });
    });
}

function alreadyPurchased(id) {
    return new Promise((resolve, reject) => {
        getPool()
            .query(`SELECT purchaser
            FROM presents
            WHERE id = ?`, [id])
            .then(result => {
                if(result[0].purchaser != null) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            }).catch(err => {
                reject(err);
            })
        });
}

function purchasedBy(id, purchaser) {
    return new Promise((resolve, reject) => {
        getPool()
            .query(`SELECT 1
            FROM presents
            WHERE id = ? AND purchaser = ?`, [id, purchaser])
            .then(result => {
                if(result.length > 0) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            }).catch(err => {
                reject(err);
            })
        });
}

function getOtherPresents(requester) {
    return new Promise((resolve, reject) => {
        getPresentsQuery(requester)
        .then(presents => {
            var groupedPresents = [];
            for(var index in presents) {
                var specificPresent = {};
                specificPresent.presentId = presents[index].presentId;
                specificPresent.description = presents[index].description;
                specificPresent.url = presents[index].url;
                specificPresent.purchasedByMe = presents[index].purchaseByMe == 1;
                specificPresent.purchased = presents[index].purchased == 1;

                var indexOfExisting = groupedPresents.findIndex(i => i.name == presents[index].userName);
                var user;
                if(indexOfExisting >= 0) {
                    user = groupedPresents[indexOfExisting];
                } else {
                    user = {"name": presents[index].userName, presents: []};
                    groupedPresents.push(user);
                }

                user.presents.push(specificPresent);
            }
            resolve(groupedPresents);
        })
        .catch(error => {
            console.error(error);
            reject(error);
        })
    });
    
}

function getPresentsQuery(requester) {
    return getPool()
    .query(`
    SELECT 
    users.ID as userId
    , users.userName
    , presents.ID as presentId
    , presents.description
    , presents.url
    , COALESCE(presents.purchaser, 0) = following.follower  as purchaseByMe
    , COALESCE(presents.purchaser, 0) > 0 as purchased
    FROM following
    INNER JOIN users ON users.ID = following.followee
    INNER JOIN presents ON presents.requester = users.ID
    WHERE following.follower = ?`, [requester]);
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
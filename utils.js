 function getResponseCode(err, res) {
    if(err == "Not Found") {
        return 404;
    } else if(err == "Conflict") {
        return 409;
    } else if(err == "Forbidden") {
        return 403;
    } else if(err != null) {
        return 400;
    } else {
        return 200;
    }
}

function getResponseBody(err, res) {
    if(err != null) {
        return err.message
    } else {
        return JSON.stringify(res);
    }
}

module.exports.getOutputHelper = (callback) => {
    return (err, res) => callback(null, {
        statusCode: getResponseCode(err, res),
        body: getResponseBody(err, res),
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
        },
    });
}

module.exports.getResponseCode = getResponseCode;
module.exports.getResponseBody = getResponseBody;
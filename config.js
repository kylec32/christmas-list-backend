const config = {
    connectionLimit : 1,
    host            : process.env.DB_HOST,
    user            : process.env.DB_USER,
    password        : process.env.DB_PASSWORD,
    database        : process.env.DB_DATABASE
  };

module.exports.dbconfig = config;
module.exports.jwtsignature = process.env.JWT_SIGNATURE;
module.exports.hashingPassword = process.env.HASHING_PASSWORD;
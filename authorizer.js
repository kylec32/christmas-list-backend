const jwt = require('jsonwebtoken');
const jwtsignature = require('./config.js').jwtsignature;


const generatePolicy = (principalId, effect, resource) => {
    const authResponse = {};
    authResponse.principalId = principalId;
    if (effect && resource) {
      const policyDocument = {};
      policyDocument.Version = '2012-10-17';
      policyDocument.Statement = [];
      const statementOne = {};
      statementOne.Action = 'execute-api:Invoke';
      statementOne.Effect = effect;
      statementOne.Resource = resource;
      policyDocument.Statement[0] = statementOne;
      authResponse.policyDocument = policyDocument;
    }
    return authResponse;
};

module.exports.auth = (event, context, callback) => {
    if (event.authorizationToken) {
      // remove "bearer " from token
      const token = event.authorizationToken.substring(7);

      try {
        const decoded = jwt.verify(token, jwtsignature);
        callback(null, generatePolicy(decoded.userId, 'Allow', '*'));
      } catch(err) {
        console.log("rejecting in first if");
        console.log(event);
        callback('Unauthorized');
      }
    } else {
      console.log("rejecting in second if");
      console.log(event);
      callback('Unauthorized');
    }
  };
  
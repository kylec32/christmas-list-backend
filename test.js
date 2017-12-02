const getRandomName = require('./namegenerator.js');
const config = require('./config.js').hashingPassword;
const bcrypt = require('bcrypt');

for(var i=0; i<5; i++) {
    console.log(bcrypt.hashSync(`emailAddress_password`, 5));
}

if(bcrypt.compareSync("emailAddress_password", "$2a$05$jL9UMX//7CayzbSvWoxPQuFRWQjwgL6QmUCWKeD10rDC4wBuC4LQ6"))
    console.log("Hi");
else 
    console.log("blah")

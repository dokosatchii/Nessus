var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var sc = require('./server-config.js');

var isAuthorized = function(api_key, callback) {
    getTokenList(function(data) {
        console.log(data);
        if(data.includes(api_key)){
            callback(200);
        } else {
            callback(404);
        }
    });
}

var getTokenList = function(callback) {
    var filename = path.join(process.cwd(), 'tokens.json');    
    fs.readFile(filename, function(err, data) {
        if(err) {
            callback(404);
        }
        else {
            var jsonContents = JSON.parse(data);
            var tokens = jsonContents.map(function(value) {
                return value['token'];
            });
            console.log(tokens);
            callback(tokens);
        }
    });
}

var loginUser = function(response, credentials, callback)  {
	if('username' in credentials && 'password' in credentials) {
        verifyUser(credentials['username'], credentials['password'], function(loggedin) {
            if(loggedin == 200) {
                //Add this to a config file
                generateToken(sc.key, credentials['username'], function(token) {
                    response.writeHead(200);
                    response.write('logging in, use this token for subsequent requests:\n' + token);
                    callback(200);
                });
            }
            else if(loggedin == 401 || loggedin == 404) {
                if(loggedin == 404) {
                    console.log('404 User does not exist');
                }
                else {
                    console.log('401 Incorrect login credentials');
                }

                response.writeHead(401);
                response.write('incorrect log in');
                callback(loggedin);
            }
        });
    }
	else {
		response.writeHead(404);
		response.write('Invalid query parameters, need username and password');
		callback(404);
	}
}

var verifyUser = function(username, password, callback) {
    getUsers(function(users) {
        var found;
        for (var i = 0; i < users.length; i++) {
            if(users[i]['user'] == username && users[i]['password'] == password) {
                found = 200;       
            }
            else if(users[i]['user'] == username && users[i]['password'] != password) {
                found = 401;
            }
        }
        if(found) {
            callback(found);
        }
        else {
            callback(404);
        }
    });
}

var getUsers = function(callback) {
    //pull users from configuration file and check credentials
    //passwords should be hashed
    var jsonContent = fs.readFileSync('users.json');
    var users = JSON.parse(jsonContent);
    callback(users['users']);
}

var generateToken = function(key, user, callback) {
   var hash = crypto.createHmac('sha512', key);
   hash.update(generateRandomString());
   var value = hash.digest('hex');
   saveToken(value, user, function(status) {
       if(status == 200) {
           callback(value);
       }
       else {
           callback(404);
       }
   }); 
}

function generateRandomString() {
   return Math.floor((Math.random() * 1000000)+1).toString(); 
}

var saveToken = function(token, user, callback) { 
    filename = path.join(process.cwd(), 'tokens.json');
    fs.readFile(filename, function(err, data) {
        if(err) {
            var users = [];
            users.push({'name':user,'token':token});
            fs.writeFile(filename, JSON.stringify(users), function(err) {
                if(err) {
                    callback(404);
                    console.log(err);
                } else {
                    console.log('Token saved');
                    callback(200);
                }
            });
        }
        else {
            var users = JSON.parse(data);
            var found = 0;
            users.forEach(function(value) {
                if(value['name'] == user) {
                    found = 1;
                    return value['token'] = token;
                }
            });
            if(!found) {
                users.push({'name':user,'token':token});
            }
            fs.writeFile(filename, JSON.stringify(users), function(err) {
                if(err) {
                    console.log(err);
                    callback(404);
                } else {
                    console.log('Token saved');
                    callback(200);
                }
            });
        }
    });
}

var logoutUser = function(response, credentials, callback) {
    if('username' in credentials) {
        deleteToken(credentials['username'], function(loggedout){
            response.writeHead(200);
            response.write('Successfully logged out');
            callback(200);
        });   
    }
    else {
        response.writeHead(400);
        response.write('Need a username to logout');
        callback(400);
    }
}

var deleteToken = function(user, callback) {
    filename = path.join(process.cwd(), 'tokens.json');
    fs.readFile(filename, function(err, data) {
        if(err) {
            console.log(err);
            callback(404);
        } else {
            var jsonContent = JSON.parse(data);
            var users = [];
            jsonContent.forEach(function(value) {
                if(value['name'] != user) {
                    users.push(value);
                }
            });
            fs.writeFile(filename, JSON.stringify(users), function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log('Token Removed');
                callback(200);
            });
        }
    });
}

module.exports = {
    isAuthorized: isAuthorized,
    loginUser: loginUser,
    logoutUser: logoutUser
}

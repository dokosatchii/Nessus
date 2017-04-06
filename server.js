var http = require('http');
var path = require('path');
var url = require('url');
var fs = require('fs');
var crypto = require('crypto');
var path = require('path');
var port = 8080;

var server = http.createServer(function(request, response) {
    var uri = url.parse(request.url);
    
    var headers = request.headers;
    var method = request.method;
    //var url = request.url;
    var body = [];
    
    //Both mehods should be POST comparing against salted & hashed passwords 
    //with requests behind HTTPS
    //Not sure if self-signing certs are permitted for this test
    //Not sure if tester will be using Curl or web-browser,
    //so keeping the endpoints basic
    
    if(uri.pathname == '/login' && method == 'GET') {
        credentials = parseQuery(uri.query);
        var loggedin;
        if('username' in credentials && 'password' in credentials) {
            loggedin = verifyUser(credentials['username'], credentials['password']);
        }
        else {
            response.writeHead(404);
            response.write('Invalid query parameters, need username and password');
            response.end();
        }

        if(loggedin == 200) {
            //Add this to config file
            var key = 'ov6kgCUvEM';
            token = generateToken(key, credentials['username']);
            response.writeHead(200);
            response.write('logging in, use this token for subsequent requests:\n' + token);
            response.end();
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
            response.end();
        }
    }

    if(uri.pathname == '/logout' && method == 'GET') {
        credentials = parseQuery(uri.query);
        loggedout = deleteToken(credentials['username']);   
        response.writeHead(200);
        response.write('Successfully logged out');
        response.end();
    }

    request.on('error', function(err) {
        console.error(err);
    }).on('data',function(chunk) {
        body.push(chuck);
    }).on('end', function() {
        body = Buffer.concat(body).toString();
    });
}).listen(port);

function generateRandomString() {
   return Math.floor((Math.random() * 1000000)+1).toString(); 
}

function deleteToken(user) {
    filename = path.join(process.cwd(), 'tokens.json');
    fs.exists(filename, function(exists) {
        if(exists) {
            var jsonContent = fs.readFileSync(filename);
            var users = JSON.parse(jsonContent);
            if(user in users) {
                delete users[user];
                fs.writeFile(filename, JSON.stringify(users), function(err) {
                    if(err) {
                        return console.log(err);
                    }
                    console.log('Token Removed');
                });
            } 
        }
    });
    return 200;
}
    
function saveToken(data, user) { 
    filename = path.join(process.cwd(), 'tokens.json');
    fs.exists(filename, function(exists) {
        if(exists) {
            var jsonContent = fs.readFileSync(filename);
            var users = JSON.parse(jsonContent);
            console.log(users);
            users[user] = data;
            fs.writeFile(filename, JSON.stringify(users), function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log('Token saved');
            });
        }
        else {
            token = {};
            token[user] = data;
            fs.appendFile(filename, JSON.stringify(token), function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log('Token saved');
            });
        }
    });
}

function generateToken(key, user) {
   var hash = crypto.createHmac('sha512', key);
   hash.update(generateRandomString());
   var value = hash.digest('hex');
   saveToken(value, user); 
   return value;
}

function getUsers() {
    //pull users from configuration file and check credentials
    //passwords should be hashed
    var jsonContent = fs.readFileSync('users.json');
    var users = JSON.parse(jsonContent);
    return users['users'];
}

function verifyUser(username, password) {
    users = getUsers();
    for (var i = 0; i < users.length; i++) {
        if(users[i]['user'] == username && users[i]['password'] == password) {
            return 200;       
        }
        else if(users[i]['user'] == username && users[i]['password'] != password) {
            return 401 
        }
    }
    return 404;
}

function parseQuery(query) {
    options = [];

    if(query.includes('&')){
        values = query.split('&');
        for(i = 0; i < values.length; i++) {
            key = values[i].split('=');
            if(key.length == 2) {
                options[key[0]] = key[1];
            }
        }
    }
    else {
        key = query.split('=');
        options[key[0]] = key[1];
    }
    return options;
}

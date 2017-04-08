var https = require('https');
var path = require('path');
var url = require('url');
var fs = require('fs');
var path = require('path');
var config = require('./configMods.js'); 
var auth = require('./authenticate.js'); 
var qs = require('querystring');
var sc = require('./server-config');

var options = {
    key: fs.readFileSync(path.join(process.cwd(), sc.secureKey)),
    cert: fs.readFileSync(path.join(process.cwd(), sc.secureCert))
};

var server = https.createServer(options).listen(sc.port, 'localhost'); 
server.on('request', function(request, response) {
    //Login paths should be POST requests comparing against salted & 
	//hashed passwords, but since I am using https, it should be OK
    //for this exercise 
    
	var uri = url.parse(request.url, true);
	var headers = request.headers;
    var method = request.method;
	var body = '';

    switch(uri.pathname) {
		case '/login':
			if(method == 'GET') {
               auth.loginUser(response, uri.query, function(responseCode) {
                    console.log(responseCode); 
                    response.end();
			    });
            }
			break;
		case '/logout':
		  	if(method == 'GET') {
               auth.logoutUser(response, uri.query, function(responseCode) {
                    console.log(responseCode); 
                    response.end();
			    });
			}
			break;
		case '/config':
		  	if(method == 'GET') {
                getConfig(response, uri.query, function(responseCode) {
                    console.log(responseCode);
                    response.end();
                });
			}
            else if(method == 'POST') {
                createConfig(response, uri.query, function(responseCode) {
                    console.log(responseCode);
                    response.end();
                });
            }
            else if(method == 'PUT') {
                modifyConfig(response, uri.query, function(responseCode) {
                    console.log(responseCode);
                    response.end();
                });
            }
            else if(method == 'DELETE') {
                deleteConfig(response, uri.query, function(responseCode) {
                    console.log(responseCode);
                    response.end();
                });
            }
            break;
		default:
		    response.write('Unknown path: ' + JSON.stringify(uri));
            response.end();
  	}
});	

//Retrieve's full list of server configurations unless
//page parameter is passed, if so default results per page 
//is 19 
function getConfig(response, credentials, callback) {
    if('api_key' in credentials) {
        auth.isAuthorized(credentials['api_key'], function (allowed) {
            if(allowed == 200) {
                var key;
                var page;
                var results = 20;
                if('sort' in credentials) {
                    key = credentials['sort']; 
                }
                if('page' in credentials && !isNaN(credentials['page'])) {
                    page = credentials['page'];        
                }

                if('results' in credentials && !isNaN(credentials['results'])) {
                    results = credentials['results'];        
                }

                config.retrieveConfig(key, page, results, function(data) {
                    response.writeHead(200);
                    response.write(JSON.stringify(data));
                    callback(200);
                });
            }
            else{
                response.writeHead(401);
                response.write('Not authorized to acces this resource');
                callback(401);
            }
        });
    }
    else {
        response.writeHead(401);
        response.write('API key was not supplied');
        callback(401);
    }
}

//Deletes a server configuration based on the name field
function deleteConfig(response, credentials, callback) {
    if('api_key' in credentials) {
        auth.isAuthorized(credentials['api_key'], function (allowed) {
            if(allowed == 200) {
                if('name' in credentials) {
                    config.deleteConfig(credentials['name'], function(deleted) {
                        if(deleted == 204) {
                            response.writeHead(204);
                            response.write('Resource removed');
                            callback(204);
                        }
                        else {
                            console.log('Error reading disk or file');
                            response.writeHead(404);
                            callback(404);
                        }
                    });
                }
                else {
                    response.writeHead(400);
                    response.write('Invalid request, must specify a name paramter');
                    callback(400);
                }
            }
            else{
                response.writeHead(401);
                response.write('Not authorized to acces this resource');
                callback(401);
            }
        });
    }
    else {
        response.writeHead(401);
        response.write('API key was not supplied');
        callback(401);
    }
}

//modifys a config based on the name paramter
function modifyConfig(response, credentials, callback) {
    if('api_key' in credentials) {
        auth.isAuthorized(credentials['api_key'], function (allowed) {
            if(allowed == 200) {
                if('configname' in credentials) {
                    var keys = Object.keys(credentials);
                    var mods = {};
                    for(var entry in keys) {
                        if(keys[entry] != 'api_key' && keys[entry] != 'configname') {
                            mods[keys[entry]] = credentials[keys[entry]];
                        }
                    }
                    config.modifyConfig(credentials['configname'], mods, function(modified) {
                        if(modified == 201) {
                            response.writeHead(201);
                            response.write('Resource modified');
                            callback(201);
                        }
                        else {
                            console.log('Error reading disk or file');
                            response.writeHead(404);
                            callback(404);
                        }
                    });
                }
                else {
                    response.writeHead(400);
                    response.write('Invalid request, must specify a name paramter');
                    callback(400);
                }
            }
            else{
                response.writeHead(401);
                response.write('Not authorized to acces this resource');
                callback(401);
            }
        });
    }
    else {
        response.writeHead(401);
        response.write('API key was not supplied');
        callback(401);
    }
}

//Creates an entirely new configuration, errors if all 
parameters are not passed    
function createConfig(response, credentials, callback) { 
    if('api_key' in credentials) {
        auth.isAuthorized(credentials['api_key'], function (allowed) {
            if(allowed == 200) {
                var keys = Object.keys(credentials);
                var mods = {};
                for(var entry in keys) {
                    if(keys[entry] != 'api_key') {
                        mods[keys[entry]] = credentials[keys[entry]];
                    }
                }
                config.createConfig(mods, function(modified) {
                    if(modified == 204) {
                        response.writeHead(204);
                        response.write('New resource created');
                        callback(204);
                    }
                    else if(modified == 406) {
                        response.writeHead(406);
                        response.write('Not enough paramters');
                        callback(406);
                    }
                    else {
                        console.log('Error reading disk or file');
                        response.writeHead(404);
                        callback(404);
                    }
                });
            }
            else{
                response.writeHead(401);
                response.write('Not authorized to acces this resource');
                callback(401);
            }
        });
    }
    else {
        response.writeHead(401);
        response.write('API key was not supplied');
        response.end();
    }
}

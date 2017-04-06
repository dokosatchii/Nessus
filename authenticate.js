var fs = require('fs');
var path = require('path');

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

module.exports = {
    isAuthorized: isAuthorized
}

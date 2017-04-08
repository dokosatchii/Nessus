var fs = require('fs');
var path = require('path');

var getConfigFile = function() {
    var filename = path.join(process.cwd(), 'configurations.json');    
    return filename;
}

var retrieveConfig = function(key, page, results, callback) {
    var valid_sorts = ['name', 'hostname', 'port', 'username'];
    var filename = getConfigFile();
    fs.readFile(filename, function(err, data) {
        if(err) callback(404);
        data = JSON.parse(data);
        if(key != null && valid_sorts.includes(key)) {
            console.log(data);
            data['configurations'].sort(function(a,b) {
                if(a[key] < b[key]) {
                    return -1;
                }
                if(a[key] > b[key]) {
                    return 1;
                }
                return 0;
            });   
        }
        var items = data['configurations'].length;
        console.log(data);
        if(page != null)
        {
            if(page*results >= items) {
                var subset = data['configurations'].splice(0,items - results);         
                console.log('Larger');
                console.log(items);
                console.log(results);
                console.log(data);
            }
            else if(page == 1) {
                data['configurations'].splice(results);
                console.log(data);
                console.log('1 Page');
            }
            else {
                data['configurations'].splice(0, (page*results)-results);
                data['configurations'].splice(results-1);
                console.log(data);   
            }
            callback(data);
        }
        else {
            callback(data);       
        }
    });
}
function hasRequiredFields(data) {
    var keys = Object.keys(data);
    if( keys.includes('name')  &&  keys.includes('hostname') && keys.includes('port') && keys.includes('username')) {
        return true;
    }
    else {
        return false;
    }
}

var createConfig = function(newConfig, callback) {
    retrieveConfig(null, null, null, function(data) {
        if(data != 404) {
            if(hasRequiredFields(newConfig)){
                data['configurations'].push(newConfig);
                fs.writeFile(getConfigFile(), JSON.stringify(data), function(err) {
                    if(err) { 
                        callback(404);
                    }
                    else {
                        callback(204);
                    }
                });
            }
            else {
                callback(406);
            }
        }    
        else { callback(404) }
    });
}

var deleteConfig = function(name, callback) {
    //TOOD: Delete configuration based on multiple criteria
    retrieveConfig(null, null, null, function(data) {
        if(data != 404) {
            var new_config = {};
            new_config['configurations'] = data['configurations'].filter(function(value) {
                if(value['name'] != name) {
                    return value; 
                }
            });
            fs.writeFile(getConfigFile(), JSON.stringify(new_config), function(err) {
                if(err) { 
                    results = callback(404); 
                } else { 
                results = callback(204);
                }
            });
        }
        else {
            callback(404);
        }
    });
}

var retrieveSpecificConfig = function(name, callback) {
    //TODO Retrieve configuration based on multiple criteria
    retrieveConfig(null, null, null, function(data) {
        if(data != 404) {
            var config = data['configurations'].filter(function(value) {
                if(value['name'] == name){
                    return value;
                }
            });
            if(config.length > 0) {
                callback(config[0]);
            } else {
                callback(404);
            }
        }
        else {
            callback(404);
        }
    });
}

var modifyConfig = function(name, mods, callback) {
    //TODO Modify specific configuration based on multiple criteria
    retrieveSpecificConfig(name, function(data) {
        if(data != 404) {
            originalKeys = Object.keys(data);
            for(var entry in mods) {
                if(originalKeys.includes(entry)) {
                    data[entry] = mods[entry];
                }
            }
            deleteConfig(name, function(deleteResponse) {
                if(deleteResponse != 404) {
                    createConfig(data, function(createResponse) {
                        if(createResponse != 404) {
                            callback(201);
                        }
                    });
                }
            });
        }
        else {
            callback(404);
        }
    });
}

module.exports = {
    modifyConfig: modifyConfig,
    deleteConfig: deleteConfig,
    createConfig : createConfig,
    retrieveSpecificConfig : retrieveSpecificConfig,
    retrieveConfig : retrieveConfig,
    getConfigFile : getConfigFile,
}

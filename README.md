# Nessus Interview Exam
Server Settings:

Server settings can be found in the server-config.js file. There you will find variables for the port, certificates, and a key for token
generation

How to use:
To start the web server, please type npm start on the command line. There are 3 routes to answer the exercises provided by the exam.

/login
/logout
/config

#Logging in
To log in, credentials must have an entry in the users.json file. 
https://localhost:8080/login?username="username"&password="password"

This will return a SHA512 API key to be used on subsequent requests to perform configuration operations. You can generate a new token by
logging in again. 

#Logging out
To log out, hit the endpoint:
https://localhost:8080/logout?username="username"

This will remove the token from token.json

#Configuration modifications
As stated earlier, the configuration endpoint requires you to pass in an API key in order for you to access the configuration resources.
To get a full list of configurations, hit the end point: 
https://localhost:8080/config?api_key="API KEY"

To retrieve a sorted list of configurations:
https://localhost:8080/config?api_key="API KEY"&sort="field"

You can also reduce the amount of items shown per request, the default result response is 19, but can be changed:
https://localhost:8080/config?api_key="API KEY"&page=3&results=5

And of course, you can string the above commands together:
https://localhost:8080/config?api_key="API KEY"&page=3&results=5&sort="name"gg

Deleting a configuration
You can delete a specific configuration by passing a DELETE method to the following enpoint:
https://localhost:8080/config?api_key="API KEY"&name="configuration_name"

Creating a configuration
You can create a specific configuration by passing a POST method to the following enpoint:
https://localhost:8080/config?api_key="API KEY"&name=host30&hostname=www.yahoo.com&port=1111&username=julie

If all configuration paramaters are not present, an error will be returned.

Modify a configuration
You can modify a specific configuration by passing in a PUT method to the following enpoint:
https://localhost:8080/config?api_key="API KEY"&configname="configuration_name"&name="new name"...




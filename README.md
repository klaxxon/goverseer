GOverseer - Go Overseer

This is a simple HTTPS web server that provides a dynamic webpage that can be used to display any metrics, in a variety of ways.  The objective was to be able to throw simple JSON objects containing metrics like load, disk space, bandwidth, process running, etc. to a lightweight server, and be able to display the results in a flexible format.

Functional
The server listens for webserver requests to provide the base web page, websocket connections from the javascript routine on the webpage, to provide real-time updates, and http metric pushes from clients.

Monitor page
Tags within the monitor page......



Setup
Clone project into your go/src folder.
Within the project folder, generate your self signed server keys:

# Private key
openssl genrsa -out server.key 2048
openssl ecparam -genkey -name secp384r1 -out server.key

# Certificate
openssl req -new -x509 -sha256 -key server.key -out server.crt -days 3650


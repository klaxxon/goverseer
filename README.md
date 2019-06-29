GOverseer - Go Overseer

This is a simple HTTPS web server that provides a dynamic webpage that can be used to display any metrics, in a variety of ways.  The objective was to be able to throw simple JSON objects containing metrics like load, disk space, bandwidth, process running, etc. to a lightweight server, and be able to display the results in a flexible format.

Functional
The server listens for webserver requests to provide the base web page, websocket connections from the javascript routine on the webpage, to provide real-time updates, and http metric pushes from clients.

Monitor page
Tags within the monitor page......

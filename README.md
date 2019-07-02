# GOverseer - Go Overseer ![alt text](https://github.com/klaxxon/goverseer/raw/master/gopher.png "Logo Title Text 1")

This is a simple HTTPS web server that provides a dynamic webpage that can be used to display any metrics, in a variety of ways.  The objective was to be able to throw simple JSON objects containing metrics like load, disk space, bandwidth, process running, etc. to a lightweight server, and be able to display the results in a flexible format.



## Functional:
The server listens for webserver requests to provide the base web page, websocket connections from the javascript routine on the webpage, to provide real-time updates, and http metric pushes from clients.


## Monitor page:
Tags within the monitor page can be host/metric specific or metric generic.  A generic metric works only with appending text areas, otherwise, a gauge or single text field will overwrite as each host reports it's metric.  These are handled below with templates.

### Very specific
To show the cpu_idle metric from the "Development" host as a text field, gauge and chart:
```
<div class="container">
      Specific host/metric as text<br/>
      <div class="metric" metric="Development.cpu_idle">
        <div widget="text" show="hm"></div>
        <div widget="gauge"></div>
        <div widget="chart"></div>
        <div class="name"></div>
      </div>
    </div>
```


### Templating
Templating allows you to define a look for dynamic entries, for example, as new hosts report in, the template is cloned for the specific metric for the new host.  Put an ID onto the template so the app can track instantiations.

In this case, a new instance of "varietyTest" will be created for each host responding with a cpu_user metric.  This will consist of text, gauge and chart.
```
<div class="template metric" metric="cpu_user" id="varietyTest">
  <div widget="text"></div>
  <div widget="gauge"></div>
  <div widget="chart"></div>
  <div class="name"></div>
</div>
```

## Setup:
Clone project into your go/src folder.
Within the project folder, generate your self signed server keys:


### Private key
```
openssl genrsa -out server.key 2048
openssl ecparam -genkey -name secp384r1 -out server.key
```

### Certificate
```
openssl req -new -x509 -sha256 -key server.key -out server.crt -days 3650
```

```
$> go run goverseer.go
```

Access the page at:
```
https://localhost:44444
```




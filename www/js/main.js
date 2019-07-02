
$( document ).ready(function() {
  google.charts.load('current', {'packages':['gauge','corechart']});
  google.charts.setOnLoadCallback(buildLookups);
  var socket = connect();
});

var metric2element = [];
function buildLookups() {
  $('[metric]').each(function(e,f) {
    var m = $(f).attr("metric");
    if (metric2element[m] == undefined) {
      metric2element[m] = [];
    }
    if (!$(f).hasClass("template")) {
      // Iterate over children to find specic widgets that need initial setup.
      $(f).find('[widget="chart"]').each(function(e,f) {
        metric2element[m].push(f);
        drawChart(f);
      });
      $(f).find('[widget="gauge"]').each(function(e,f) {
        metric2element[m].push(f);
        drawGauge(f);
      });
      $(f).find('[widget="text"]').each(function(e,f) {
        metric2element[m].push(f);
      });
      $(f).find('.name').each(function(e,f) {
        $(f).html(m);
      });
    }
    else {
      metric2element[m].push(f);
    }
  });  
 }

function connect() {
  var socket = new WebSocket("wss://" + location.host + "/ws");
  socket.onopen = function () {
    console.log("Status: Connected");
  };

  socket.onmessage = function (e) {
    json = JSON.parse(e.data);
    console.log("Server: ",json);
    processMessage(json);
  };

  socket.onclose = function() {
    console.log("onclose");
    reConnect();
  };

  socket.onerror = function(e) {
    console.log("onerror", e);
    socket.close();
    reConnect();
  };
  return socket;
}

function reConnect() {
  var timer = setTimeout(function() {
    console.log("Timer");
    connect();
  }, 5000);
}

function send(txt) {
  socket.send(txt);
}


function processMessage(jsonArr) {
  var t = jsonArr.metrics;
  //console.log("t", t);
  for(x in jsonArr.metrics) {
    var json = jsonArr.metrics[x];
    // Host/metric
    var key = json.host + "." + json.metric;
    var elems = metric2element[key];
    for(var a in elems) {
      if (!$(elems[a]).hasClass("template")) updateElement(elems[a], json);
    }
    // Just metric
    var key = json.metric;
    elems = metric2element[key];
    for(var a in elems) {
      if (!$(elems[a]).hasClass("template")) updateElement(elems[a], json);
      else {
        key = json.host + "." + json.metric;
        var uuid = $(elems[a]).attr("id") + "_" + key;
        // Do we need to add an instance?
        if (!metric2element[uuid]) {
          console.log(key, "does not exist");
          // Duplicate each widget
          $(elems[a]).find("[widget]").each(function(e,f) {
            console.log("widget", e,f);
            var ndiv = $(f).clone();
            $(ndiv).removeClass("template");

            var wcontainer =  document.createElement( "div" );
            $(wcontainer).append($(ndiv));
            drawGauge($(ndiv)[0]);
            updateElement($(ndiv)[0], json);

            // So we do not create again
            metric2element[uuid] = true;
            // Add to existing (if) widget list
            if (metric2element[key] == undefined) {
              metric2element[key] = [];
            }
            metric2element[key].push($(ndiv));

            $(elems[a]).find(".name").each(function(e,f) {
              var ndiv = $(f).clone();
              $(ndiv).html(key);
              $(wcontainer).append($(ndiv));
            });

            $(elems[a]).parent().append(wcontainer);
          });
        }
      }
    }
  }
}


function updateElement(f, json) {
  var widget = $(f).attr("widget");
  if (widget == "chart") {
    var limit = $(f).data("limit");
    if (limit == undefined || !limit) limit = 100;
    var rows = $(f).data("_data").addRows(1);
    if (rows >= limit) {
      $(f).data("_data").removeRow(0);
    }
    $(f).data("_data").setValue($(f).data("_data").getNumberOfRows()-1,1, parseFloat(json.value));
    $(f).data("_widget").draw($(f).data("_data"), $(f).data("_options"));
  } 
  else if (widget == "gauge") {
    $(f).data("_data").setValue(0, 1, parseFloat(json.value));
    $(f).data("_widget").draw($(f).data("_data"), $(f).data("_options"));
  } 
  else {
    var show = $(f).attr("show");
    if (show == "h") {
      json.value = json.host + " = " + json.value;
    }
    else if (show == "hm") {
      json.value = json.host + " / " + json.metric + " = " + json.value;
    }
    var alimit = $(f).attr("limit");
    if (alimit > 0) {
      var count = $(f).data("_count");
      if (isNaN(count)) count = 0;
      console.log("count", count);
      $(f).data("_count", count + 1);
      if (count >= alimit) {
        var txt = $(f).html();
        // Remove last linefeed
        txt = txt.substring(0, txt.length-1);
        $(f).html(txt.substring(0, txt.lastIndexOf("\n")));
      }
      $(f).prepend(json.value + "<br/>\n");
    } else {
      $(f).html(json.value);
    }
  }
}

function drawChart(f) {
  var options = {
    width: 240, height: 120,
    max:100.0, min:0,
    minorTicks: 25
  };
  var data = google.visualization.arrayToDataTable([
    ['Label', 'Value'],
    ['Value', 0],
  ]);
  var chart = new google.visualization.LineChart(f);  
  $(f).data("_data", data);
  $(f).data("_options", options);
  $(f).data("_widget", chart);
  chart.draw(data, options);
}


function drawGauge(f) {
  console.log("drawGauge", f);
  var options = {
    width: 120, height: 120,
    max:100, min:0,
    redFrom: 90, redTo: 100,
    yellowFrom:75, yellowTo: 90,
    minorTicks: 5
  };
  var data = google.visualization.arrayToDataTable([
    ['Label', 'Value'],
    ['Value', 0],
  ]);
  var chart = new google.visualization.Gauge(f);  
  $(f).data("_data", data);
  $(f).data("_options", options);
  $(f).data("_widget", chart);
  chart.draw(data, options);
}
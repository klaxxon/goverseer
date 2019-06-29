google.charts.load('current', {'packages':['gauge','corechart']});
google.charts.setOnLoadCallback(drawChart);

var socket = connect();

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


function processMessage(json) {
  var t = json.metric;
  console.log("t", t);
  $('[data-metric="' + t + '"]').each(function(e,f) {
    var widget = $(f).data("widget");
    if (widget == "chart") {
      var rows = $(f).data("_data").addRows(1);
      if (rows >= 10) {
        $(f).data("_data").removeRow(0);
      }
      $(f).data("_data").setValue($(f).data("_data").getNumberOfRows()-1,1, parseFloat(json.value));
      $(f).data("_widget").draw($(f).data("_data"), $(f).data("_options"));
    } else if (widget == "gauge") {
      $(f).data("_data").setValue(0, 1, parseFloat(json.value));
      $(f).data("_widget").draw($(f).data("_data"), $(f).data("_options"));
    } else if ($(f).data("append")) {
      $(f).append(json.value);
    } else $(f).html(json.value);
  });
}

function drawChart() {
  $('[data-widget="chart"]').each(function(e,f) {
    var options = {
      width: 4800, height: 120,
      max:1.0, min:0,
      minorTicks: .25
    };
    var data = google.visualization.arrayToDataTable([
      ['Label', 'Value'],
      ['Value', 0],
    ]);
    var chart = new google.visualization.LineChart(f);  
    $(f).data("_data", data);
    $(f).data("_options", options);
    $(f).data("_widget", chart);
  });
  $('[data-widget="gauge"]').each(function(e,f) {
    var options = {
      width: 120, height: 120,
      max:1.0, min:0,
      redFrom: .9, redTo: 1.0,
      yellowFrom:.75, yellowTo: .9,
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
  });
}
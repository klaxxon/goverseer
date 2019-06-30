<?php
define('METRIC_SERVER', '127.0.0.1:44444');
define('METRIC_HOST', 'PhpTester');

pushMetric('temperature', rand(200,400)/10.0);


function pushMetric($metric, $val) {
  $data = ["host"=>METRIC_HOST, "metric"=>$metric, "value"=>"$val"];

  $opts = array(
    'http' => array(
      'method'  => 'POST',
      'header'  => 'Content-type: application/x-www-form-urlencoded',
      'content' => json_encode($data)
    ),
    'ssl' => [ 
      'verify_peer' => false, 
      'allow_self_signed'=> true,
      'verify_peer_name' => false
    ],
  );
  $context  = stream_context_create($opts);
  $result = file_get_contents('https://'.METRIC_SERVER.'/metric', false, $context);
  echo $result;
}
<?php
define('METRIC_SERVER', '192.168.0.10:44444');
define('METRIC_HOST', 'Test Server);

$pfile = popen("dstat -cdn --nocolor --noupdate 15",'r');
while ($l = fgets($pfile)) {
  $l = preg_replace('#\\x1b[[][^A-Za-z]*[A-Za-z]#', '', $l);
  echo "line $l\n";
  $l = str_replace(":", " ", $l);
  $l =  preg_replace(array('/\s{2,}/', '/[\t\n]/'), ' ', trim($l));
  $arr = explode(" ", $l);
  foreach($arr as $k=>$v) {
    $arr[$k] = convSI($v);
  }
  print_r($arr);
  pushMetric('cpu_user', $arr[0]);
  pushMetric('cpu_sys', $arr[1]);
  pushMetric('cpu_idle', $arr[2]);
  pushMetric('cpu_wait', $arr[3]);
  pushMetric('cpu_stl', $arr[4]);
  pushMetric('disk_read', $arr[5]);
  pushMetric('disk_write', $arr[6]);
  pushMetric('net_recv', $arr[7]);
  pushMetric('net_send', $arr[8]);
}

function convSI($x) {
  $u = substr($x, strlen($x)-1,1);
  $x = floor($x);
  if ($u=='k') $x *= 1000;
  else if ($u=='m') $x *= 1000000;
  else if ($u=='g') $x *= 1000000000;
  return $x;
}

function pushMetric($metric, $val) {
  $data = ["host"=>METRIC_HOST, "metric"=>$metric, "value"=>"$val", "interval"=>15];

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


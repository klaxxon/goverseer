<?PHP
define('METRIC_SERVER', '192.168.1.11:44444');
define('METRIC_HOST', 'GettysDevMonitor');

$metrics = array();
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
  $metrics = array();
  addMetric('cpu_user', $arr[0]);
  addMetric('cpu_sys', $arr[1]);
  addMetric('cpu_idle', $arr[2]);
  addMetric('cpu_wait', $arr[3]);
  addMetric('cpu_stl', $arr[4]);
  addMetric('disk_read', $arr[5]);
  addMetric('disk_write', $arr[6]);
  addMetric('net_recv', $arr[7]);
  addMetric('net_send', $arr[8]);
  pushMetrics();
}

function convSI($x) {
  $u = substr($x, strlen($x)-1,1);
  $x = floor($x);
  if ($u=='k') $x *= 1000;
  else if ($u=='m') $x *= 1000000;
  else if ($u=='g') $x *= 1000000000;
  return $x;
}

function addMetric($metric, $val) {
  global $metrics;
  $data = ["host"=>METRIC_HOST, "metric"=>$metric, "value"=>"$val","interval"=>15];
  $metrics[] = $data;
}
  

function pushMetrics() {
  global $metrics;

  $obj = new stdClass();
  $obj->apikey = '';
  $obj->metrics = $metrics;

  $opts = array(
    'http' => array(
      'method'  => 'POST',
      'header'  => 'Content-type: application/x-www-form-urlencoded',
      'content' => json_encode($obj)
    ),
    'ssl' => [ 
      'verify_peer' => false, 
      'allow_self_signed'=> true,
      'verify_peer_name' => false
    ],
  );
  $context  = stream_context_create($opts);
  $result = file_get_contents('https://'.METRIC_SERVER.'/metric', false, $context);
  print_r($opts);
  echo $result;
}


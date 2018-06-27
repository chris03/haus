<?php
require 'rollingcurlx.class.php';
$RCX = new RollingCurlX(10);
$serverUrl = 'http://10.42.0.4:8080';
$resultMap = array();
$sensors = array
(
array('flow',48,'Percentage'),
array('lux',47,'counter'),
array('tempOut',45,'temp'),
array('tempPool',43,'temp'),
array('tempHeater',46,'temp'),
array('energy',52,'counter')
);
$results = array_pad(array(), count($sensors)*2, 0);
function callback($response, $url, $request_info, $user_data, $time) {
  global $results, $resultMap;
  $results[$resultMap[md5($url)]]=$response;
}

$time_start = microtime(true);
$urls = array();
 $i=0;
 foreach ($sensors as $value) {
        $name =$value[0];
        $id = $value[1];
        $sensor = $value[2];
        $urlGraph = sprintf("%s/json.htm?type=graph&sensor=%s&idx=%u&range=day", $serverUrl, $sensor, $id);
        $urlDevice = sprintf("%s/json.htm?type=devices&rid=%u", $serverUrl, $id);

        $RCX->addRequest($urlGraph, null, 'callback');
        $RCX->addRequest($urlDevice, null, 'callback');
        $resultMap[md5($urlDevice)]=$i++;
        $resultMap[md5($urlGraph)]=$i++;
    }
$RCX->execute();
$time_query = microtime(true) - $time_start;
$time_start = microtime(true);

//if(!ob_start("ob_gzhandler")) ob_start();
header('Content-type: application/json');
echo "{";
    for($i=0;$i<count($sensors);$i++) { 
        $name =$sensors[$i][0];
        $id = $sensors[$i][1];
        $sensor = $sensors[$i][2];
        $graphData = $results[$i*2+1];
        $data = json_decode($results[$i*2])->result[0];

        echo sprintf("\"%s\": { \"data\": %s, \"graph\": %s },", $name, json_encode($data), $graphData);
    }
    echo "\"time\": " . time() . ",\"queryTime\":". $time_query . ",\"outputTime\":" . (microtime(true) - $time_start);
    echo "}";
?>

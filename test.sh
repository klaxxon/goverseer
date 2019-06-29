#!/bin/bash

COUNT=0
while true
do
	curl -d "{\"host\":\"GettysDev\",\"metric\":\"static\",\"value\":\"1234\"}" -k -X POST https://localhost:44444/metric
	sleep 1
  DT=`date`
	curl -d "{\"host\":\"GettysDev\",\"metric\":\"datetime\",\"value\":\"$DT\"}" -k -X POST https://localhost:44444/metric
	sleep 1
  COUNT=$((COUNT+1))
	curl -d "{\"host\":\"GettysDev\",\"metric\":\"counter\",\"value\":\"$COUNT\"}" -k -X POST https://localhost:44444/metric
	sleep 1
done



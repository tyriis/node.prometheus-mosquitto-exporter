# node.prometheus-mosquitto-exporter

this is just a quick project for exporting mosquitto MQTT stats to prometheus, https://github.com/sapcc/mosquitto-exporter just showed me a lot of buggy values

docker build -t <your username>/prometheus-mosquitto-exporter .

docker run -p 9234:9234 -d <your username>/prometheus-mosquitto-exporter

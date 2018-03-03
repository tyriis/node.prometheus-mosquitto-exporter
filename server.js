let config = require('./config.json');
let express = require('express');
let app = express();

let data = {};
let MQTTClient = require('async-mqtt');
let mqtt =  MQTTClient.connect(config.mqtt.url);
mqtt.subscribe("$SYS/#");
mqtt.on('message', (topic, message) => {
    message = message.toString('utf8');
    if (!data[topic]) {
        data[topic] = {
            label: topic.replace('$SYS/broker/', '').split('/').join('_').split(' ').join('_'),
            type: message.indexOf('.') > 0 ? 'gauge' : 'counter'
        }
    }
    data[topic].value = message.replace(' seconds', '')
});

app.get('/', function (req, res) {
    res.send('\n' +
        '<html>\n' +
        '<head><title>Mosquitto Exporter</title></head>\n' +
        '<body>\n' +
        '<h1>Mosquitto Exporter</h1>\n' +
        '<p><a href="/metrics">Metrics</a></p>\n' +
        '</body>\n' +
        '</html>\n');
});

app.get('/metrics', function (req, res) {
    let string = '';
    for (let topic in data) {
        if (['$SYS/broker/version', '$SYS/broker/timestamp'].indexOf(topic) >= 0) {
            continue
        }
        string += `# HELP ${data[topic].label} ${topic}\n` +
            `# TYPE ${data[topic].label} ${data[topic].type}\n` +
            `${data[topic].label} ${data[topic].value}\n`
    }
    res.set('Content-Type', 'text/plain');
    res.send(string);
});

app.listen(9234, function () {
    console.log('http://localhost:9234');
});

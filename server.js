let path = require('path')
let express = require('express')
let MQTTClient = require('async-mqtt')

let config = require('./config.json')
let counterTopics = [
  '$SYS/broker/bytes/received',
  '$SYS/broker/bytes/sent',
  '$SYS/broker/messages/received',
  '$SYS/broker/messages/sent',
  '$SYS/broker/publish/messages/received',
  '$SYS/broker/publish/messages/sent',
  '$SYS/broker/publish/messages/dropped'
]
let data = {}
let mqtt =  MQTTClient.connect(config.mqtt.url)

mqtt.subscribe("$SYS/#");

mqtt.on('message', (topic, message) => {
    message = message.toString('utf8').replace(' seconds', '')
    if (!data[topic]) {
        data[topic] = {
            label: topic.replace('$SYS/', '').split('/').join('_').split(' ').join('_'),
            type: counterTopics.includes(topic) ? 'counter' : 'gauge'
        }
    }
    if (!message.includes('.') &&  message.length > 5) {
        message = parseInt(message).toExponential(8)
    }
    data[topic].value = message
})

let app = express()

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
})

app.get('/metrics', function (req, res) {
  let connected = mqtt._client.connected;
  let str = '# HELP broker_connected_state exporter is connected to the broker or not\n' +
    '# TYPE broker_connected_state gauge\n' +
    `broker_connected_state ${connected ? 1 : 0}\n`;
  for (let topic in data) {
    if (['$SYS/broker/version', '$SYS/broker/timestamp'].includes(topic)) {
      continue
    }
    let value = connected ? data[topic].value : 0;
    str += `# HELP ${data[topic].label} ${topic}\n` +
      `# TYPE ${data[topic].label} ${data[topic].type}\n` +
      `${data[topic].label} ${value}\n`
  }
  res.set('Content-Type', 'text/plain')
  res.send(str);
})

app.listen(9234, () => {
  console.log(`http://localhost:9234`)
})

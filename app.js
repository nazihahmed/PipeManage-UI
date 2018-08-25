const express = require('express');
const app = express();
const http = require('http').Server(app);
const bodyParser = require('body-parser');
const cors = require('cors');
const redis = require('socket.io-redis');

/* COMMON utilities */
const thingSocket = require('./common/thingSocket');

app.use(bodyParser.urlencoded({extended:false}));
app.use(cors());

app.use(
  "/static",
  express.static(__dirname + "/dist/static")
);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/dist/index.html');
});

const port = 3000;

const server = app.listen(port, function () {
    console.log('Server running at http://127.0.0.1:' + port + '/');
});

thingSocket(server);

if(process.env.REDIS_ENDPOINT) {
  io.adapter(redis({ host: process.env.REDIS_ENDPOINT, port: 6379 }));
}

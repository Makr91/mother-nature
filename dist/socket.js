//import * as socketio from 'socket.io';
//import * as express from 'express';
//import { time } from './time';

var https = require('https');
var fs = require('fs');

const socketio = require("socket.io");
const express = require("express");
const os = require("os");
const port = process.env.PORT || 3003;
const env = process.env.NODE_ENV || "development";
const app = express();
process.cwd();
var options = {
  key: fs.readFileSync('dist/encryption/m4kr.key'),
  cert: fs.readFileSync('dist/encryption/m4kr.cert'),
  ca : fs.readFileSync( 'dist/encryption/CABUNDLE.crt' )
};


app.set('port', port);
app.set('env', env);
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


const server = https.createServer(options, app).listen(app.get('port'), () => {
    console.log('Mother Nature is listening via ssl on port ' + app.get('port'));
});


const io = socketio(server, { 'origins': '*:*' });

const escapeHtml = (text = "") => {
  return text.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
};

io.on('connection', (client) => {
  console.log("client connected...");
  client.on("join", (data) => {
    console.log(data);
    console.log(`user ${data.username} on frequency ${data.frq}`);
    client.join(data.frq);
    client.to(data.frq).emit('frqUpdate', socket.getFrqStats(data.frq));
    io.emit('statsUpdate', socket.getServerStats());
  });
  client.on("leave", (data) => {
    console.log('leave', data);
    client.leave(data.frq);
    client.disconnect(true);
    client.to(data.frq).emit('frqUpdate', socket.getFrqStats(data.frq));
    io.emit('statsUpdate', socket.getServerStats());
  });
  // client.on("send", (data) => {
  //     console.log(data);
  //     if (!data["msg"] || data["msg"] === "" || !data["frq"] || data["frq"] === "")
  //         return;
  //     //sanitize data
  //     data["frq"] = escapeHtml(data["frq"]).substring(0, 32);
  //     data["msg"] = escapeHtml(data["msg"]).substring(0, 512);
  //     client.to(data.frq).emit('chat', data);
  // });
  client.on('disconnect', () => {
    // TODO: optimize
    Object.keys(io.sockets.adapter.rooms).map(frq => {
      io.to(frq).emit('frqUpdate', {
        frq: frq,
        clientsCount: Object.keys(io.sockets.adapter.rooms[frq].sockets).length
      });
    });
    io.emit('statsUpdate', socket.getServerStats());
  });
  client.on('inputX', (data, callback) => {
    console.log('inputX', data);
    callback("I heard you, my child");
  });
  client.on('inputY', (data) => {
    console.log('inputY', data);
  });
  client.emit('host', os.hostname());
});

const router = express.Router(); // get an instance of the express Router
router.get('/', (req, res) => {
  res.json({ health: 'OK' });
});
router.get('/stats', (req, res) => {
  res.json(socket.getServerStats());
});
router.get('/room/:frq/stats', (req, res) => {
  if (io.sockets.adapter.rooms[req.params.frq]) {
    res.json(socket.getFrqStats(req.params.frq));
  } else {
    res.status(404);
  }
});
router.get('/timer', (req, res) => {
  res.json({currentTime: time.getCurrentMilliseconds()});
});
app.use('/', router);

exports.getServerStats = () => {
  return {
    clientsCount: io.engine.clientsCount - 1,
    roomsCount: Object.keys(io.sockets.adapter.rooms).length - io.engine.clientsCount
  };
}

exports.getFrqStats = () => {
  return {
    frq: frq,
    clientsCount: io.sockets.adapter.rooms[frq] ? io.sockets.adapter.rooms[frq].length : 0
  };
}

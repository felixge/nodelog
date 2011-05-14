var sys = require('sys');
var config = require('./config').config;

var irc = require('./lib/irc');
var fs = require('fs');
var path = require('path');
var repl = require('repl');

sys.puts(sys.inspect(config));

var logFile, day;
function writeLog(text) {
  var date = new Date;
  var today = [
     date.getFullYear(),
     // Poor man's zero padding FTW
     ('0'+(date.getMonth()+1)).substr(-2),
     ('0'+date.getDate()).substr(-2),
  ].join('-');

  if (!logFile || day !== today) {
    var logFilePath = path.join(config.logPath, today+'.txt');
    logFile = fs.createWriteStream(logFilePath, {'flags': 'a+', 'encoding': 'utf8'});
    day = today;
  }
  
  var time = [
    ('0'+date.getHours()).substr(-2),
    ('0'+date.getMinutes()).substr(-2)
  ].join(':');
  logFile.write('['+time+'] '+text+'\n');
}

var
  client = new irc.Client(config.host, config.port),
  inChannel = false;

client.connect(config.user);

client.addListener('001', function() {
  this.send('JOIN', config.channel);
});

client.addListener('JOIN', function(prefix) {
  inChannel = true;

  var user = irc.user(prefix);
  writeLog(user+' has joined the channel');
});

client.addListener('PART', function(prefix) {
  var user = irc.user(prefix);
  writeLog(user+' has left the channel');
});

client.addListener('DISCONNECT', function() {
  puts('Disconnected, re-connect in 5s');
  setTimeout(function() {
    puts('Trying to connect again ...');

    inChannel = false;
    client.connect(config.user);
    setTimeout(function() {
      if (!inChannel) {
        puts('Re-connect timeout');
        client.disconnect();
        client.emit('DISCONNECT', 'timeout');
      }
    }, 5000);
  }, 5000);
});

client.addListener('PRIVMSG', function(prefix, channel, text) {
  switch (text) {
    case '!source':
    case '!src':
      this.send('PRIVMSG', channel, ':Source is here: '+config.srcUrl);
      break;
    case '!logs':
    case '!log':
      this.send('PRIVMSG', channel, ':Logs are here: '+config.logUrl);
      break;
  }

  var user = irc.user(prefix);
  writeLog(user+': '+text);
});

repl.start("logbot> ");

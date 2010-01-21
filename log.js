process.mixin(require('sys'));
var config = require('./config');

var irc = require('./lib/irc');
var file = require('file');
var path = require('path');
var repl = require('repl');

var urlRegExp = /\b(([\w-]+:\/\/?|www[.])[^\s()<>]+(?:\([\w\d]+\)|([^!'#%&()*+,-.\/:;<=>?@\[\]^_{|}~\s]|\/)))/;

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
    logFile = new file.File(path.join(config.logPath, today+'.html'), 'a+', {encoding: 'utf8'});
    logFile.write('<style>body { font-family: monospace; }</style>\n');
    day = today;
  }
  
  var time = [
    ('0'+date.getHours()).substr(-2),
    ('0'+date.getMinutes()).substr(-2)
  ].join(':');
  logFile.write('['+time+'] '+text+"<br />\n");
}

var client = new irc.Client(config.host, config.port);
client.connect(config.user);

client.addListener('001', function() {
  this.send('JOIN', config.channel);
});

client.addListener('JOIN', function(prefix) {
  var user = irc.user(prefix);
  writeLog(user+' has joined the channel');
});

client.addListener('PART', function(prefix) {
  var user = irc.user(prefix);
  writeLog(user+' has left the channel');
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
  writeLog(user+': '+text.replace(urlRegExp, '<a href="$1">$1</a>'));
});

repl.start("logbot> ");

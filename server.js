//Add Certs to cert Folder for HTTPS Support
var fs = require('fs')
    , https = require('https')
    , http = require('http')
    , express = require('express')
    , keys_dir = 'cert/'
    , server_options = {
        key  : fs.readFileSync(keys_dir + 'ssl.key'),
        cert : fs.readFileSync(keys_dir + 'ssl.crt')
      }
    , app = express();
var rawbody = require('express-rawbody');
var bodyParser = require('body-parser');
var HttpsProxyAgent = require('https-proxy-agent');
var log4js = require('log4js');


app.use(bodyParser.raw());

//Set Proxy if needed otherwise remove it
var proxy = process.nav.proxy;
var agent = new HttpsProxyAgent(proxy);
//Send Diffrent Payload back, when Redirected
var changedpayload = 'This is not from the Original Server';
var uripath = "register";

//Logging
log4js.loadAppender('file');
log4js.addAppender(log4js.appenders.file('fakecc-access.log'), 'fakecc');
var logger = log4js.getLogger('fakecc');
logger.setLevel('INFO');



function getOptions(headers, path, method) {
  var options = {
    host: headers.host,
    path: path,
    method: method,
    agent: agent,
    headers: headers
  };
  return options;
}
function getRequest(headers, path, method, response, register) {
  var req = https.request(getOptions(headers, path, method), function(res) {
    var msg = '';
    res.on('data', function(chunk) {
      msg += chunk;
    });
    res.on('end', function() {
      logger.info(msg);
      if (register) { sendResponse(msg,response)}
      else { sendResponse(changedpayload,response)}
    });
  });
  return req;
}
function sendResponse(msg,response) {
  response.send(msg);
}

app.post('*', rawbody, function(req, res) {
  var patt = new RegExp(uripath);
  //Send New Request with Payload of received Payload
  var newreq = getRequest(req.headers, req.originalUrl, req.method,res,patt.test(req.params[0]));
  newreq.write(req.rawBody);
  logger.info(req.originalUrl);
  newreq.end();
});
https.createServer(server_options,app).listen(4000,function() {
  console.log("HTTPS Server listening on Port 4000")
});

var http = require('http');
var formidable = require('formidable');
var fs = require('fs');

var port = 8080;

'use strict';

var os = require('os');
var ifaces = os.networkInterfaces();

Object.keys(ifaces).forEach(function (ifname) {
 var alias = 0;

 ifaces[ifname].forEach(function (iface) {
  if ('IPv4' !== iface.family || iface.internal !== false) {
      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      return;
   }

   if (alias >= 1) {
      // this single interface has multiple ipv4 addresses
      console.log(ifname + ':' + alias, iface.address);
   } else {
      // this interface has only one ipv4 adress
      console.log(ifname, iface.address);
   }
   ++alias;
});
});
console.log('Port: ' + port);

http.createServer(function (req, res) {
   console.log('Requested: ' + req.url);
   if (req.url == '/fileupload') {
      var form = new formidable.IncomingForm();
      form.parse(req, function (err, fields, files) {
         var oldpath = files.filetoupload.path;
         var newpath = '/tmp/' + files.filetoupload.name;
         fs.rename(oldpath, newpath, function (err) {
            if (err) throw err;
            res.write('<p>File uploaded!</p>');
            res.write('<a href="/getfiles">Clicc 2 get files!</a>');
            res.end();
         });
      });
      res.end();
   } else if (req.url == '/') {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write(fs.readFileSync(__dirname + '/public/index.html', 'utf-8'));
      res.end();
   } else if (req.url == '/getfiles') {
      res.writeHead(200, {'Content-Type': 'text/html'});
      fs.readdirSync(__dirname + '/public/files/').forEach(file => {
         console.log(file);
         res.write('<a href="/'+file+'" download="'+ file +'">'+file+'</a>\n<br>\n');
      });
      res.end();
   } else {
      if (fs.existsSync(__dirname + '/public/files' + req.url)) {
         fs.readFile(__dirname + '/public/files' + req.url, function (err, content) {
            if (err) {
               res.writeHead(400, {'Content-type':'text/html'})
               console.log(err);
               res.end("ERROR OCCURED");    
            } else {
               //specify Content will be an attachment
               res.setHeader('Content-disposition', 'attachment; filename='+req.url);
               res.end(content);
            }
         });
      } else {
         res.writeHead(200, {'Content-Type': 'text/html'});
         res.write('<b>File ' + __dirname + '/public/files' + req.url + ' not found.</b>');
         res.end();
      }
   }
}).listen(port);

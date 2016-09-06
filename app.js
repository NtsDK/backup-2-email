var nodemailer = require('nodemailer');
var fs = require('fs');
var dateFormat = require('dateformat');
var zlib = require('zlib');
var fstream = require('fstream');
var tar = require('tar');
var config = require('./config');

var transporter = nodemailer.createTransport(['smtps://', config.get('fromMail'), ':', config.get('password'), '@' , 
                                              config.get('smtpServer')].join(''));

var date = dateFormat(new Date(), "yyyy-mm-dd h:MM:ss");

// setup e-mail data with unicode symbols
var mailOptions = {
    from: config.get('fromMail'), // sender address
    to: config.get('toMail'), // list of receivers
    text: 'Test', // plaintext body,
};

// send mail with defined transport object
setInterval(function(){
//setTimeout(function(){
    var date = dateFormat(new Date(), "yyyy-mm-dd h:MM:ss");
    var stream = fstream.Reader({ 'path': config.get('folderPath'), 'type': 'Directory' });
    stream.on('error', function(e){
      console.log(e.name + ': ' + e.message);
      stream.resume();
    });
    mailOptions.attachments = [{
        filename: 'archive_' + date + '.tar.gz',
        content: stream
        .pipe(tar.Pack())
        .pipe(zlib.Gzip())
    }];
    mailOptions.subject = config.get('backupName') + ' - ' + date, // Subject line
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            return console.log(error);
        }
        console.log('Message sent: ' + info.response);
    });
}, config.get('timeInterval'));
//}, 30000);
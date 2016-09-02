var nodemailer = require('nodemailer');
var fs = require('fs');
var dateFormat = require('dateformat');
var zlib = require('zlib');
var fstream = require('fstream');
var tar = require('tar');
var config = require('./config');

var transporter = nodemailer.createTransport(['smtps://', config.get('mail'), ':', config.get('password'), '@' , 
                                              config.get('smtpServer')].join(''));

var date = dateFormat(new Date(), "yyyy-mm-dd h:MM:ss");

// setup e-mail data with unicode symbols
var mailOptions = {
    from: config.get('mail'), // sender address
    to: config.get('mail'), // list of receivers
    subject: config.get('backupName') + ' - ' + date, // Subject line
    text: 'Test', // plaintext body,
};

// send mail with defined transport object
setInterval(function(){
    mailOptions.attachments = [{
        filename: 'archive_' + date + '.tar.gz',
        content: fstream.Reader({ 'path': config.get('folderPath'), 'type': 'Directory' })
        .pipe(tar.Pack())
        .pipe(zlib.Gzip())
    }];
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            return console.log(error);
        }
        console.log('Message sent: ' + info.response);
    });
}, config.get('timeInterval'));
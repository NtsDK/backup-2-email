var nodemailer = require('nodemailer');
var fs = require('fs');
var dateFormat = require('dateformat');
var zlib = require('zlib');
var fstream = require('fstream');
var tar = require('tar');
var config = require('./config');
var logger = require('winston');
var path = require('path');

var dateFun = () => dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");

var logInfo = str => logger.info('[' + dateFun() + '] ' + str);
var logError = str => logger.error('[' + dateFun() + '] ' + str);

var transporter = nodemailer.createTransport(['smtps://', config.get('fromMail'), ':', config.get('password'), '@' , 
                                              config.get('smtpServer')].join(''));



// setup e-mail data with unicode symbols
var mailOptions = {
    from: config.get('fromMail'), // sender address
    to: config.get('toMail'), // list of receivers
    text: 'Test', // plaintext body,
};

function contains(str, substr) {
	return str.indexOf(substr) !== -1;
}

// send mail with defined transport object
function makeBackup(){
	logInfo('Backup started');
	var date = dateFun();
	var stream = fstream.Reader({ 'path': config.get('folderPath'), 'type': 'Directory' , filter: function () {
		if(contains(this.basename,'nims-base2.json') || 
		  contains(this.basename,'nims-base3.json') ||
		  contains(this.basename,'_output.log')){
			logInfo('skip file ' + this.basename);
			return false;
		}
		logInfo('proceed file ' + this.basename);
		return true;
	}});
	stream.on('error', function(e){
	  logError(e.name + ': ' + e.message);
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
            return logError(error);
        }
        logInfo('Message sent: ' + info.response);
		logInfo('Backup finished successfully');
		//logger.flush();
		process.stdout.write('');
    });
};

if(config.get('singleRun')){
	logInfo('Single run enabled');
} else {
	logInfo('Interval run enabled');
	setInterval(makeBackup, config.get('timeInterval'));	
}
makeBackup();

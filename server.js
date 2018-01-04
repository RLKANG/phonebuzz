var twilio = require('twilio');

const dotenv = require('dotenv').config();
var client = new twilio(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);

const hbs = require('express-hbs');
const express = require('express');
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const bodyParser = require('body-parser');
const urlencoded = bodyParser.urlencoded;

const app = express();
//app.engine('html', hbs.express3({ extname: '.html' }));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(urlencoded({extended: false}));
app.use(bodyParser.urlencoded({ extended: true }));

const MongoClient = require('mongodb').MongoClient;

var url_base = process.env.URL_BASE;
var twilio_number = process.env.TWILIO_NUMBER;

var mongo_url = 'mongodb://user:password@ds051585.mlab.com:51585/phonebuzz_calls';

var db;
var id = '';

app.get('/', function (request, response) {
  db.collection('calls').find().toArray(function(error, result) {
   if (error) {
    response.status(400).send('Error connecting to database');
    return;
   }
   else {
    response.render('index.ejs', {calls: result});
   }
  });
});

app.post('/phonebuzz', function (request, response) {
  if (!twilio.validateExpressRequest(request, process.env.AUTH_TOKEN)) {
   response.status(403).send('Twilio Authentication failed');
   return;
  }
  const twiml = new VoiceResponse();
 
  function gather() {
    const gatherNode = twiml.gather();
    gatherNode.say('please enter a number');

    twiml.redirect('/phonebuzz');
  }

  if (!isNaN(parseInt(request.body.Digits))) {
    var number = parseInt(request.body.Digits);
    if (id != '') {
     db.collection('calls').update({_id: id},{$set:{user_number: number}});
     id = '';
    }
    var fizzBuzz = '';

    for (var i = 1; i <= number; i++) {
     if (i%15 == 0) { fizzBuzz += 'fizzbuzz'; }
     else if (i%3 == 0) { fizzBuzz += 'fizz';}
     else if (i%5 == 0) { fizzBuzz += 'buzz';}
     else { fizzBuzz += i; }

     if (i != number) { fizzBuzz += ', ' }
    }
    twiml.say(fizzBuzz);
  }
  else {
    gather();
  }
  
  response.type('text/xml');
  response.send(twiml.toString());
});

app.post('/call', function (request, response) {
 var minutes = request.body.minutes;
 var seconds = request.body.seconds;
 var pnumber = request.body.pnumber;
 if (minutes == '') {
  minutes = 0;
 }
 if (seconds == '') {
  seconds = 0;
 }
 setTimeout(function() {
 client.calls.create({
    url: url_base + '/phonebuzz',
    to: pnumber,
    from: twilio_number
 }, function(error, call) {
    if (error) {
     response.status(403).send(error.message);
     return;
    }
    else {
     db.collection('calls').save
     ({_id: call.sid, time: Date(), delay_min: minutes, delay_sec: seconds, phone_number: pnumber, user_number: 'N/A'}, function (error, result) {
     if (error) {
      response.status(403).send(error.message);
      return;
     }
     else {
      id = call.sid;
      response.redirect('/');
     }
    });
   }
  });
 }, minutes*60000 + seconds*1000);
});

app.post('/replay/:id', function (request, response) {
 var id = request.params.id;
 db.collection('calls').find({_id: id}).toArray(function(error, documents) {
  if (error) {
   response.status(403).send(error.message);
   return;
  }
  else {
   var minutes = documents[0].delay_min;
   var seconds = documents[0].delay_sec;
   var pnumber = documents[0].phone_number;
   var unumber = documents[0].user_number; 
   var unumber_copy = unumber;
   if (unumber_copy == 'N/A') {
    unumber_copy = 0;
   }
   setTimeout(function() {
   client.calls.create({
    url: url_base + '/replay_call/' + unumber_copy,
    to: pnumber,
    from: twilio_number
   }, function(error, call) {
    if (error) {
     response.status(403).send(error.message);
     return;
    }
    else {
     db.collection('calls').save
     ({_id: call.sid, time: Date(), delay_min: minutes, delay_sec: seconds, phone_number: pnumber, user_number: unumber}, function (error, result) {
     if (error) {
      response.status(403).send(error.message);
      return;
     }
     else {
      response.redirect('/');
     }
    });
    }
   });
   }, minutes*60000 + seconds*1000);
  }
 });
});

app.post('/replay_call/:num', function (request, response) {
 var num = request.params.num;
 
 const twiml = new VoiceResponse();
 var fizzBuzz = '';

 for (var i = 1; i <= num; i++) {
  if (i%15 == 0) { fizzBuzz += 'fizzbuzz'; }
  else if (i%3 == 0) { fizzBuzz += 'fizz';}
  else if (i%5 == 0) { fizzBuzz += 'buzz';}
  else { fizzBuzz += i; }
  
  if (i != num) { fizzBuzz += ', ' }
 }
 twiml.say(fizzBuzz);

 response.type('text/xml');
 response.send(twiml.toString());
});
 
MongoClient.connect(mongo_url, function(error, database) {
  if (error || database == null) {
   return console.log(error);
  }
  db = database;
  app.listen(3000, function() {
    console.log('listening on port 3000');
  });
});

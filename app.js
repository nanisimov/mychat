
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var requestHTTP = require('request');

//var bluemix = require('./config/bluemix');
var watson = require('watson-developer-cloud');
//var extend = require('util')._extend;

var app = express();

// all environments
app.set('port', process.env.PORT || 3333);
//app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
//app.use(express.favicon());
//app.use(express.logger('dev'));
//app.use(express.json());
//app.use(express.urlencoded());
//app.use(express.methodOverride());
//app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'dist')));
console.log('DEBUG: '+path.join(__dirname, 'dist')); 


var server=http.createServer(app);
var io=require('socket.io').listen(server);

var querystring = require('querystring');
var post_data= querystring.stringify({intext:'good'});
var options = {
    host: "nanisimov.pythonanywhere.com",
    port: 80,
    path: "/get_sentiment",
    method: "POST",
    headers:{ "Accept":"application/json; charset=UTF-8",
              'Content-Type': 'application/x-www-form-urlencoded',  //'Content-Length': post_data.length   
             },
};
var nlp_provider='bp';
var chat_bot_name="None";
//--------AlchemyAPI staff
var AlchemyAPI_key="aa2212103d779086ea521eded3523ca2df73c47c";
var AlchemyAPI_url="http://gateway-a.watsonplatform.net/calls/text/TextGetTextSentiment";

// development only
//if ('development' == app.get('env')) {
//  app.use(express.errorHandler());
//}
app.get('/index.html', function (req, res) {
	var now = new Date(); 
	console.log(log_time_stemp()+'ip='+req.ip+': Responding with index file. ');
	res.sendfile(__dirname + '/index.html'); });
app.get('/test1.html', function (req, res) {
	res.sendfile(__dirname + '/test1.html'); });
app.get('/', routes.index);
app.get('/users', user.list);

io.sockets.on('connection', function (socket) {
  console.log(log_time_stemp()+'WebSocket client connected, socked ID='+socket.id);
  socket.on('request',function(request){
  //	socket.join(sroom);
  //	supervisorSocket=socket;
  	console.log(log_time_stemp()+'Socket '+ socket.id+' Request = '+JSON.stringify(request));
  	if (request.name==="connect"){
  		socket.join(request.room);
  		nlp_provider=request.nlp_provider;
  		//io.to(request.room).emit('event',{'name':'connect_ok','username':request.username,'text':'User #1 jointed the room #2'.replace('#1',request.username).replace('#2',request.room)});
  	    io.to(request.room).emit('event',{'name':'connect_ok','username':'System','text':'User #1 jointed the room #2'.replace('#1',request.username).replace('#2',request.room)});
  	    if (request.room==='Eliza'){
  	    	chat_bot_name='Eliza';
  	    	options.path= "/connect_to_chatbot";
  	    	var httpRequest = http.request(options, function(response) {
  		       console.log(log_time_stemp()+'Request connect to chatbot '+request.chatbot);
            //console.log('HEADERS:', response.headers);
               response.setEncoding('utf8');
               var str='';
              response.on('data', function (chunk) {
            	str+=chunk;
                sent=Number(str);
                });
              response.on('end',function(){
            	//var j=JSON.parse(str);
            	console.log(log_time_stemp()+str);
            	//sent=Number(str);            	
            	//var mssg="AI agent Eliza joined";
            	var revent= {'name':'message','username':'System','text':'AI Agent Eliza joined','sentiment':5,'provider':'System'};
            	var revent2= {'name':'message','username':'Eliza','text':str,'sentiment':5,'provider':'System','voice':true};
                console.log(log_time_stemp()+"Event emitted = "+JSON.stringify(revent));
  		        io.to(request.room).emit('event',revent);
  		        io.to(request.room).emit('event',revent2);
                });
            });
            post_data= querystring.stringify({'chatbot':'Eliza'});
            httpRequest.write(post_data);
            httpRequest.end();
  	    }else if(request.room==='Karl'){
  	    	console.log(log_time_stemp()+'Request connect to Karl, our QA specialist ');
  	    	var revent= {'name':'message','username':'System','text':'AI Agent Karl joined. You can ask him questions about retirement.','sentiment':1,'provider':'System'};
            console.log(log_time_stemp()+"Event emitted = "+JSON.stringify(revent));
  		    io.to(request.room).emit('event',revent);
  	    }
  	}else if(request.name==="message"){
  	  var sent=0;
  	  if(request.nlp_provider==='bp'){
  	  	options.path= "/get_sentiment2";
  	  	options.host= "nanisimov.pythonanywhere.com";
  		var httpRequest = http.request(options, function(response) {
  		    console.log(log_time_stemp()+'Request BP NLP service');
            response.setEncoding('utf8');
            var str='';
            response.on('data', function (chunk) {
            	str+=chunk;
                //sent=Number(str);
            });
            response.on('end',function(){
            	console.log(str);
            	sent=Number(str);
            	var revent= {'name':'message','username':request.username,'text':request.text,'sentiment':sent,'provider':'bp'};
                console.log(log_time_stemp()+"Event emitted = "+JSON.stringify(revent));
  		        io.to(request.room).emit('event',revent);
  		        if(request.room==="Eliza") ask_Elisa(request);
  		        if(request.room==="Karl") ask_Karl(request);
            });
        });
        post_data= querystring.stringify({intext:request.text});
        httpRequest.write(post_data);
        httpRequest.end();
       }else if(request.nlp_provider==='ibm_watson'){
       	var furl=AlchemyAPI_url+"?apikey="+AlchemyAPI_key+"&outputMode=json&showSourceText=1&text="+encodeURIComponent(request.text);
       	console.log("DEBUG: furl="+furl);
       	//options.path= "/get_sentiment";
  		http.get(furl, function(response) {
  		//http.get(AlchemyAPI_options, function(response) {
  		//var httpRequest = http.request(AlchemyAPI_options, function(response) {
  		    console.log(log_time_stemp()+'Request IBM Watson NLP SA service');
            response.setEncoding('utf8');
            var str='';
            response.on('data', function (chunk) {
            	str+=chunk;
                //sent=Number(str);
            });
            response.on('end',function(){
            	sent=JSON.parse(str).docSentiment.hasOwnProperty('score')?JSON.parse(str).docSentiment.score:0.0;
            	var revent= {'name':'message','username':request.username,'text':request.text,'sentiment':sent,'provider':'ibm_watson'};
                console.log(log_time_stemp()+"Event emitted = "+JSON.stringify(revent));
  		        io.to(request.room).emit('event',revent);
  		        if(request.room=="Eliza") ask_Elisa(request);
            });
            //response.on('error', console.error);
            response.on('error', function(err){
            	console.log(err);
            });  
        });
       }else if(request.nlp_provider==='aspect_nlu'){
       	  console.log(log_time_stemp()+'Request Aspect NLP SA service');
       	  url_aspect1="http://demostorymapper.cloudapp.net:80/storymapper/analyze?languageModelCode=ENG&bodyText="+encodeURIComponent(request.text);
       	  http.get(url_aspect1, function(response) {
  		    console.log(log_time_stemp()+'Response for Aspect NLP1 SA service');
            response.setEncoding('utf8');
            var body='';
            response.on('data', function (chunk) {
            	body+=chunk;
                //sent=Number(str);
            });
            response.on('end',function(){
            	var position=body.search("tone=");
              	var sentm=0;
              	if (position>=0 && body.slice(position+6,position+14)==='positive'){
              		sentm=1.0;
              	}else if(position>=0 && body.slice(position+6,position+14)==='negative'){
              		sentm=-1.0;
              	};
              	//var sentm=body.slice(position+10,position+18);
                console.log('DEBUG: sentiment='+body.slice(position+6,position+14));
                var revent= {'name':'message','username':request.username,'text':request.text,'sentiment':sentm,'provider':'aspect_nlu'};
                console.log(log_time_stemp()+"Event emitted = "+JSON.stringify(revent));
  		        io.to(request.room).emit('event',revent);
  		        if(request.room=="Eliza") ask_Elisa(request);
            });
            //response.on('error', console.error);
            response.on('error', function(err){
            	console.log(err);
            });  
        });
          
       }else if(request.nlp_provider==='aspect_nlu2'){
       	 console.log('\nDEBUG: text='+request.text.replace('<br>',''));
       	 requestHTTP.post('http://lsystest.cloudapp.net/t2ken/t2k.aspx',
           { form: { senderInput: request.text.replace('<br>','') } },
           function (error, response, body) {
              if (!error && response.statusCode == 200) {
              	var position=body.search("polarity=");
              	var sentm=0;
              	if (position>=0 && body.slice(position+10,position+18)==='Positive'){
              		sentm=1.0;
              	}else if(position>=0 && body.slice(position+10,position+18)==='Negative'){
              		sentm=-1.0;
              	};
              	//var sentm=body.slice(position+10,position+18);
                console.log('DEBUG: sentiment='+sentm);
                var revent= {'name':'message','username':request.username,'text':request.text,'sentiment':sentm,'provider':'aspect_nlu2'};
                console.log(log_time_stemp()+"Event emitted = "+JSON.stringify(revent));
  		        io.to(request.room).emit('event',revent);
  		        if(request.room=="Eliza") ask_Elisa(request);
              }
         });
       }else{};
       
        
  	}else{};
  });
});
//---Ask Eliza
function ask_Elisa(request){
	options.path= "/ask_chat_bot";
	options.host= "nanisimov.pythonanywhere.com";
  	var httpRequest = http.request(options, function(response) {
  		  console.log(log_time_stemp()+'Asking chat bot: '+request.text);
          response.setEncoding('utf8');
          var str='';
          response.on('data', function (chunk) {
            str+=chunk;
            sent=Number(str);
          });
          response.on('end',function(){
            console.log(str);
            var revent= {'name':'message','username':'Eliza','text':str,'voice':true,'model':'woman'};
            console.log(log_time_stemp()+"Event emitted = "+JSON.stringify(revent));
  		    io.to(request.room).emit('event',revent);
          });
    });
    post_data= querystring.stringify({'text':request.text});
    httpRequest.write(post_data);
    httpRequest.end();
};

function ask_Karl(request){
	options.path= "/ask_QA_service";
	options.host= "nanisimov.pythonanywhere.com";
	console.log(log_time_stemp()+"QA request recieved = "+request.text);
	var str='You ask me '+request.text+" But I don't know! Sorry.";
  	var httpRequest = http.request(options, function(response) {
  		  console.log(log_time_stemp()+'Asking QA service: '+request.text);
          response.setEncoding('utf8');
          var str='';
          response.on('data', function (chunk) {
            str+=chunk;
            sent=Number(str);
          });
          response.on('end',function(){
            console.log(str);
            //var strj=JSON.parse(str);
            var revent= {'name':'message','username':'Karl','text':str,'voice':true,'model':'man'};
            console.log(log_time_stemp()+"Event emitted = "+JSON.stringify(revent));
  		    io.to(request.room).emit('event',revent);
          });
    });
    post_data= querystring.stringify({'text':request.text});
    httpRequest.write(post_data);
    httpRequest.end();
};
//---------------TTS--------------------------
 
var tts_credentials = {
  url: 'https://stream.watsonplatform.net/text-to-speech/api',
  version: 'v1',
  username: '57b9e0ba-20e8-4f20-bcdb-ff8e864ed546',
  password: '2lmvgxfOMBL9',
};
//}, bluemix.getServiceCreds('text_to_speech'));

// Create the service wrappers
var textToSpeech = watson.text_to_speech(tts_credentials);

/*
app.get('/synthesizeNEW', function(req, res) {
	console.log('Synthesize request: ', req.query.text)
	textToSpeech.synthesize({text:req.query.text}, function(err, response) {
  	  if (err) {console.log('Synthesize error: ', error); return;}
      console.log('Synthesize success: ', response)
    });
});*/

app.get('/synthesize', function(req, res) {
  var transcript = textToSpeech.synthesize(req.query);
  transcript.on('response', function(response) {
    if (req.query.download) {
      response.headers['content-disposition'] = 'attachment; filename=transcript.ogg';
    }
  });
  transcript.on('error', function(error) {
    console.log('Synthesize error: ', error)
  });
  transcript.pipe(res);
});

//---------------STT--------------------------
var stt_credentials = {
  url: 'https://stream.watsonplatform.net/speech-to-text/api',
  version: 'v1',
  username: '83294ff0-4974-4746-b9b0-ef3cb47a1dba',
  password: 'Rl9wNNkbPzhm',
};
var authorization = watson.authorization(stt_credentials);
app.get('/get_token',function(req,res){
	console.log('\nRequest for token: ', 'From IP='+req.ip)
	authorization.getToken({url: stt_credentials.url}, function(err, token) {
    if (err) { console.log('Request for token ERROR:', err); res.status(err.code); };
    console.log('\nRequest for token success: ', 'token='+token)
    res.send(token);
  });
});

//http.createServer(app).listen(app.get('port'), function(){
//  console.log('Express server listening on port ' + app.get('port'));
//});
server.listen(app.get('port'),function(){
	console.log('Express server listening on port '+app.get('port'));
});
function log_time_stemp(){
	var now = new Date(); 
	//return now.toLocaleDateString()+' '+now.toTimeString()+': ';
	return now.toISOString()+': ';
	//return now.toString()+': ';
}

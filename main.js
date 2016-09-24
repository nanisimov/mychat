//Chat client
var username='Sidle_Jinks';
var chatServer='http://67.188.242.223:3333';
var chatRoom='Eliza';
var position=0;


var sentiment_flag='all';
var nlp_source='bp';
var TTSisON=true;
var STTisON=true;
// TTS staff
var ttsAudio = document.createElement('audio'),    
    ttsVoiceLisa    = 'en-US_LisaVoice',
    ttsVoiceMichael = 'en-US_MichaelVoice',
    ttsVoice = ttsVoiceLisa;
// STT staff
var stream;
var stt_socket;
var token="";
var currentModel= 'en-US_BroadbandModel';
var contentType ='audio/l16';//'audio/l16;rate=22050'; 'audio/wav';  or 'audio/flac'
window.BUFFERSIZE = 8192;
var options = {};
    options.token = token;
    options.message = {
      'action': 'start',
      'content-type': contentType,
      'interim_results': true,
      'continuous': true,
      'word_confidence': true,
      'timestamps': true,
      'max_alternatives': 3
    };
    options.model = currentModel;

// Chat bot staff
var bots = Ext.create('Ext.data.Store', {
    fields: ['abbr', 'name'],
    data : [
        {"abbr":"Eliza","name":"Eliza (hello from Eliza!)"},
        {"abbr":"Iesha","name":"Iesha (teen anime junky)"},
        {"abbr":"Rude","name":"Rude (abusive bot)"},
        {"abbr":"Suntsu","name":"Suntsu (Chinese sayings)"},
        {"abbr":"Zen","name":"Zen (gems of wisdom)"},
    ]
});
 
Ext.define('Connect.Window', {
       extend:'Ext.window.Window',
       title: 'User Login & Connect',
       height: 195,
       width: 400,
       itemId:'login_window',
       layout: 'fit',
       items: 
           [{  xtype:'form',
           itemId:'form',      
               frame:true,
               bodyStyle:'padding:5px 5px 0',
               width: 550,
               fieldDefaults: {
                 msgTarget: 'side',
                 labelWidth: 110
               },
               defaultType: 'textfield',
               defaults: { anchor: '100%' }, 
                  items: [{
                     fieldLabel: 'User Name',
                           //   afterLabelTextTpl: required,
                     name: 'username',
                     id:'username',
                     value: username,
                     allowBlank:false                               
                     },{
                     	fieldLabel: 'Chat URL',
                     	name: 'chatserver',
                        id:'chatserver',
                     	value: chatServer,
                     },{
                     	fieldLabel: 'Connect to Room',
                     	name: 'chatroom',
                        id:'chatroom',
                     	value: chatRoom,
                     },{
                     	xtype: 'displayfield',
                     	fieldLabel: 'Chat bots',
                     	value:'Eliza, Karl'
                     
                     }/*,{
                     	xtype:'combobox',
                     	fieldLabel: 'Connect to Bot',
                     	name: 'chatbot',
                     	store:bots,
                        id:'chatbot',
                        queryMode: 'local',
                        valueField: 'abbr',
                        displayField: 'name',
                     	value: 'None',
                     } */   
                     ],  
                     buttons: [{
                        text: 'Connect',
                        scale:'large',
                        handler: function() {
                        	var form = this.up('form').getForm();
                        	username=form.findField("username").getValue();
                        	chatServer=form.findField("chatserver").getValue();
                        	chatRoom=form.findField("chatroom").getValue();
                        	//chatBot=form.findField("chatbot").getValue();
                            socket = io.connect(chatServer);
                            var request={'name':'connect','username':username,'room':chatRoom,'nlp_provider':nlp_source};//,'chatbot':chatBot}; 
                            socket.emit('request',request);
                            socket.on('event',receive_server_event);
                            var f=this.up('#login_window').hide();	
                            }  
                       },{
                          text: 'Cancel',
                          scale:'large',
                          handler: function() {
                            //      Ext.Msg.alert('Cancel Login', 'Are you sure to cancel login?');
                             var f=this.up('#login_window').hide(); //close();
                                   }
                      }],  
          }] 
    });
    
var my_msg='<table><tr><td style="width:30%;"><img class = "newappIcon" src="javascripts/images/happy.png" style="width:50px;height:50px;"><td>#1</table>';
      
    
var dataPn=Ext.create('Ext.form.Panel', {
    itemId:'dataform',
    frame:true,
    height: 500,
    fieldDefaults: { labelWidth: 55 },
    renderTo: Ext.getBody(),
    items:[{
    	xtype:'image',
        id: 'south_image',
        src: 'javascripts/images/happy.png',
        //title:'Sentiment from '+nlp_source,
        tooltip:'Sentiment from '+nlp_source,
    //region: 'south',
        width: 50,
        height: 50
    },{
        xtype:'htmleditor',        
        width: 500,
        height: 100,
        id:'datap',
        itemId:'datap', 
        fieldLabel: 'Message',
        disabled:true,
        value:"You>>"
        //value:my_msg
      },{
    	xtype:'button',
    	text:'Start talking',
    	disabled:true,
    	itemId:'start_btn', 
    	width: '15%',
        scale:'large',
        margin: "00 5 5 59",
        handler:function(){
        	var line=Ext.get('output').dom.innerHTML;
        	position=line.length; 
        }
    },{
    	xtype:'button',
    	text:'Stop talking and Send',
    	disabled:true,
    	itemId:'cbtn',
    	width: '30%',
        scale:'large',
        margin: "00 5 5 0",
        handler:function(){
        	var line=Ext.get('output').dom.innerHTML;        	
        	if (line != '') this.up('#dataform').down('#datap').setValue('You>>'+line.slice(position));
        	position=line.length;
        	var dfield=this.up('#dataform').down('#datap');
        	var request={'name':'message','username':username,'room':chatRoom,'nlp_provider':nlp_source,'text':dfield.getValue().slice(11)}; 
            socket.emit('request',request);
            dfield.setValue('You>>');
            }
    },{
    	xtype:'button',
    	text:'Send Text',
    	itemId:'sbtn',
    	width: '30%',
        scale:'large',
        margin: "00 5 5 0",
        disabled:true,
        handler:function(){
        	var dfield=this.up('#dataform').down('#datap');
        	var request={'name':'message','username':username,'room':chatRoom,'nlp_provider':nlp_source,'text':dfield.getValue().slice(11)}; 
            socket.emit('request',request);
            dfield.setValue('You>>');
        }    
    },{  

    	xtype: 'htmleditor',
    	width: 500,
    	height: 400,
    	itemId:'log',
        overflowY : 'auto',
    	fieldLabel:'Log',
    	disabled:true,
    	margins: '10 10 10 10',
    	value:''
    }],
    buttons:[]
});
var connectWin;
var loginBtn = Ext.create('Ext.button.Button',{
        	text:'Connect',
        	//disabled:true,
            handler : function(){
             	connectWin=Ext.create('Connect.Window').show();
            }
        });
var logoutBtn = Ext.create('Ext.button.Button',{
        	text:'Disconnect',
        	disabled:true,
            handler : function(){
            }
        });
var mainToolbar = Ext.create('Ext.toolbar.Toolbar', {
    renderTo: document.body,
    items: [  loginBtn,'-',logoutBtn,'-',
    {xtype: 'splitbutton', 
     text: 'Settings',
     menu:[{
     	text:'Themes',
     	menu:[{text:'Standard',
               handler:function(){ Ext.util.CSS.swapStyleSheet("theme","../../../extjs/resources/css/ext-all.css"); }
              },{
               text:'Gray',
               handler:function(){ Ext.util.CSS.swapStyleSheet("theme","/public/javascripts/extjs/resources/css/ext-all-gray.css"); }
             }]
     },{
     	text:'NLP source',
     	menu:[{
     		text:'Proprietary',checked:true,group:'nlpsrs',
     		checkHandler:function(item,ch){nlp_source='bp'}
     	},{
     		text:'IBM Watson',checked:false,group:'nlpsrs',
     		checkHandler:function(item,ch){nlp_source='ibm_watson'}
     	},{
     		text:'Aspect NLU',checked:false,group:'nlpsrs',
     		checkHandler:function(item,ch){nlp_source='aspect_nlu'}
     	},{
     		text:'Aspect NLU2',checked:false,group:'nlpsrs',
     		checkHandler:function(item,ch){nlp_source='aspect_nlu2'}
     	}]
     },{
     	text:'Show sentiments',
     	menu:[{
         text:'All Sentiments ON',checked:true,group:'shsen',
         checkHandler:function(item,ch){sentiment_flag='all'}
      },{
         text:'All Sentiments OFF',checked:false,group:'shsen',
         checkHandler:function(item,ch){sentiment_flag='off'}
      },{
         text:'Only Negative On',checked:false,group:'shsen',
         checkHandler:function(item,ch){sentiment_flag='neg'}
      }]
     }]
    },'-', {
    	xtype: 'splitbutton', 
        text: 'Speech',
        menu:[{text:'TTS: Text To Speech',
               icon:'javascripts/images/speaker-volume.png',
               menu:[{text:'TTS is ON',checked:true,group:'tts',checkHandler:function(item,ch){TTSisON=ch;}},
                     {text:'TTS is OFF',checked:false,group:'tts'}] // group sets radio mode
              },{
              	text:'STT: Speech To Text',
                icon:'javascripts/images/microphone.png',
                menu:[{text:'STT is ON',checked:true,group:'stt',checkHandler:function(item,ch){STTisON=ch;}},
                     {text:'STT is OFF',checked:false,group:'stt'}]
              }]
    },'-',{
     xtype: 'splitbutton', text: 'Help',
     menu:[{text:'About MyChat',
     handler: function(){Ext.Msg.alert('About MyChat', 
               'Version: 0.3.0<br/>Author: Nikolay Anisimov'); }
               //'Version: 0.3.0<br/>Author: Nikolay Anisimov<br/>Bright Pattern, Inc.<br><a href="http://www.brightpattern.com" target="_blank">http://www.brightpattern.com</a>'); }
               },{text:'Play',handler:function(){
               	tts(ttsAudio,ttsVoiceMichael,"Hello! This is demo showing N.L.P. capabilities. You will talk to Elisa, enabled with text-to-speech,speech-to-text, and sentiment analysis capabilities. Enjoy.");
               }}]
    },'-',{text:'Play',hidden:true,
            handler:function(){
            	tts(ttsAudio,ttsVoice,"Hello! Are you sitting comfortably? Than we'll begin. You will talk to Elisa, enabled with text to speech and speech to text capabilities. Enjoy."); 
            } },{
            	text:'Start',icon:'javascripts/images/microphone.png',
            	itemId:'startm',
            	disabled:true,
            	handler:function(){
            		if(!STTisON){
            			Ext.Msg.alert('Warning','Speech to Text service is OFF');
            		}else{ // get token from Server->Watson
            			Ext.Ajax.request({
                           url: chatServer+"/get_token",
                           success: function(response,options){
                               //var rdata=Ext.decode(response.responseText);                               
                               //Ext.Msg.alert('Ajax request Success!','Response= '+response.responseText+', status='+response.status);
                               token= response.responseText;
                               //startWss(stt_socket,token); dataPn.down('#datap').getEl()
                               //var elId=Ext.getCmp('datap').getEl().dom;
                               mainToolbar.down('#endm').enable();
                               dataPn.down('#start_btn').enable();
                               dataPn.down('#cbtn').enable();
                               stream = WatsonSpeech.SpeechToText.recognizeMicrophone({
                                     token: token,
                                     outputElement:  '#output'  // CSS selector or DOM Element
                               });                        
                           },
                           failure: function(response,options){Ext.Msg.alert('Ajax request', 'Failure, status='+response.status);}                                       
                        });//ajax          			
            		}; //else
            	}
            	},'-',{text:'End',icon:'javascripts/images/microphone.png',
            	       disabled:true,
            	       itemId:'endm',
            	       handler:function(){
            		     stream.stop.bind(stream);
            		     Ext.Msg.alert('STT','Stopped');
            	}},'-',
            	{text:'Debug',hidden:false,handler:function(){
    	        Ext.Msg.alert('nlp_source='+nlp_source);

    }},]
    });

var nav_win_form;

Ext.onReady(function(){
	//Ext.Msg.alert('Mychat client' , 'START');
	 Ext.QuickTips.init();
	 nav_win_form =  Ext.create('Ext.window.Window', {
                       title: 'Chat client window v.0.4',
                       //iconCls:'bp',
                      // icon:'javascripts/images/bp.png',
                       itemId:'user_panel',
                       resizable : true,
                    //   height: 400,
                    //   width: 400,
                    //   bodyStyle: 'background:#777; padding:10px;',
                    //   layout: 'fit',
                        items: [mainToolbar,dataPn]
    }).show();
});

function log(message){
	//Ext.Msg.alert('Log' , 'Name='+message);
	nav_win_form.down('#log').setValue(message+nav_win_form.down('#log').getValue());
};

var my_msg='<p style="text-align:right;background:#DDDDDD;"><table style="background:#00DDDD;"><tr><td style="width:30%;background:#DDDDDD;"><img class = "newappIcon" src="javascripts/images/happy.png" style="width:50px;height:50px;"><td>#1</table></p>';

function tts(audio,voice,text){
      var downloadURL = '/synthesize?text='+text+'&voice='+voice+'&X-WDC-PL-OPT-OUT=0';
            	//var ttsAudio = document.createElement('audio');
      audio.currentTime = 0;
	  audio.pause();
      audio.src = downloadURL;
	  audio.load();
	  audio.play();
      //Ext.Msg.alert('PLAY',"x="+downloadURL);
};

function receive_server_event(x){
	//Ext.Msg.alert('Function receive_server_event' , JSON.stringify(x));
	
	var icon='';
	var iconNeutral=' <img src="javascripts/images/neutral1.png" alt=":-|" width="15" height="15" title="Sentiment from ?, value=#">';
	var iconSmile=' <img src="javascripts/images/smile2.png" alt=":-)" width="15" height="15" title="Sentiment from ?, value=#">';
	var iconAnger=' <img src="javascripts/images/anger2.png" alt=":-(" width="17" height="17" title="Sentiment from ?, value=#">';
	if(x.name==='connect_ok'){
		dataPn.down('#datap').enable();
		dataPn.down('#log').enable();
		dataPn.down('#sbtn').enable();
		logoutBtn.enable();
		mainToolbar.down('#startm').enable();
	}else if(x.name==='message'){
		var y= Ext.getCmp('south_image');
	    if(x.sentiment<0.5){
		   y.setSrc('javascripts/images/anger2.png');
		   if(sentiment_flag==='all' || sentiment_flag==='neg' ) icon=iconAnger.replace('?',x.provider).replace('#',x.sentiment);
	    }else if(x.sentiment>0.5){
		   y.setSrc('javascripts/images/happy.png');
		   if(sentiment_flag==='all') icon=iconSmile.replace('?',x.provider).replace('#',x.sentiment);
	    }else{
		   y.setSrc('javascripts/images/neutral.png');
		   if(sentiment_flag==='all') icon=iconNeutral.replace('?',x.provider).replace('#',x.sentiment); };
		//TTS for x.text
	};
	var h=x.username===username?'You':x.username;
	var ctext=x.text.replace('<br>','');
	var line=h+'>>'+ctext+icon+'<br/>';
	//var line=my_msg.replace('#1',h+'>>'+x.text+icon);
	var voice_model=ttsVoiceLisa;
	if (x.model==='man') voice_model=ttsVoiceMichael;
	if (x.voice&&TTSisON) tts(ttsAudio,voice_model,ctext);
	log(line);
	
	return;
};

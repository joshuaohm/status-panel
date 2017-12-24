"use strict";

/*
*	Status Panel Server - Joshua Ohm, 2017
*
*	Basic Node.js Server that acts as a status panel for various devices I own and things I care about. 
*
*	Use this at your own risk. Make sure you replace the secret keys, be smart about security, etc. 
*
*
*	Who knows what I'll add to this
*	
*/

process.title = 'status-panel-server';
var webSocketServerPort = 1450;
var webSocketServer = require('websocket').server;
var http = require('http');

//This should match comStatus-client.js's timeInterval variable;
var timeInterval = 6000;
var intervalThreshold = timeInterval / 2;

var panelClients = [ ];
var comStatusClients = [ ];
var connection, connectionType, comIndex, panelIndex;
 
//We don't need no state management library
var state = {

	"comStatus" : {
		"message" : "none",
		"status" : "off",
		"lastUpdate" : "",
		"connected" : "no"
	}
};



//Setup server
var server = http.createServer( function(request, response){});

server.listen(webSocketServerPort, function(){
	//console.log(("\n" + new Date()) + " Server is listening on port " + webSocketServerPort + "\n");
});

var wsServer = new webSocketServer({
	httpServer : server
});

function startClientLoop(){

	setInterval(function() {

		//console.log(state.comStatus.status);

		var toSend = {
			message : state.comStatus.message,
			status : state.comStatus.status	
		};
		
		for(var i = 0; i < panelClients.length; i++){
			panelClients[i].send(JSON.stringify(toSend));
		}

	}, timeInterval);

}



//Validate request then parse the message
wsServer.on('request', function(request){

	//---------Server Functions--------------------//

	//Function to determine a connection timeout
	function checkComStatusConnection(){
		var now = parseInt(new Date().getTime() / 1000);

		//Has it been more than (intervalThreshold + timeInterval) seconds since an update?
		//then consider the client disconnected
		if(parseInt(now - state.comStatus.lastUpdate) >= parseInt(intervalThreshold + timeInterval) / 1000 ){
			//console.log('comStatus computer disconnected!' + "\n");
			state.comStatus.connected = "no";
			state.comStatus.status = "off";
		}
		else{
			//console.log("time since update: " + parseInt(now - state.comStatus.lastUpdate) + " threshold is " + parseInt(intervalThreshold + timeInterval) / 1000 + "\n" );
		}
	}

	function printComStatus(){

		//console.log("---------" + "\n");
		//console.log(state.comStatus);
		//console.log("\n" + "---------" + "\n");

	}


	//Endlessly checks for a comStatus connection time out based on timeInterval
	function startComStatusTimeOut(){

		if(state.comStatus.connected === "yes"){


			var timeOut = setInterval( function(){
				
				checkComStatusConnection();

				if(state.comStatus.connected === "no"){
					clearInterval(timeOut);
				}
			}, timeInterval);
		}
	}

	function updateComStatus(action){

		switch(action){

			case "activate":
				state.comStatus.status = "on";
				state.comStatus.lastUpdate = parseInt(new Date().getTime() / 1000);
				break;

			default:
				console.log(new Date() + "Error: unknown comStatus Action." + "\n");
				break;
		}

		printComStatus();

	}

	function updateNewClient(index){

		if(panelClients.length > 0){

			var toSend = {
				message : state.comStatus.message,
				status : state.comStatus.status	
			};

			panelClients[index].send(JSON.stringify(toSend));
		}

	}

	function validateConnection(secret){

		if(secret === "secret-comStatus-key"){

			if(state.comStatus.connected === "no"){

				//console.log('Valid Admin Request!' + "\n");
				connection = request.accept('echo-protocol', request.origin);
				comIndex = comStatusClients.push(connection) - 1;
				state.comStatus.connected = "yes";
				startComStatusTimeOut();
				connectionType = "comStatus";
			}
			
		}

		else if(secret === "secret-panel-key"){
			//console.log('Valid Panel Request' + "\n");
			connection = request.accept('echo-protocol', request.origin);
			panelIndex = panelClients.push(connection) - 1;
			updateNewClient(panelIndex);
			connectionType = "panel";
		}

		else{

			console.log(new Date() + ' Error: invalid connection request.' + "\n");
			connection = request.accept(null, request.origin);
			connectionType = "denied";
			connection.close();
			return;

		}

		return;

	}

	//--------------End Server Functions---------------//





	//-------------Begin Connection Logic--------------//

	//console.log((new Date()) + ' Connection from origin ' + "\n");

	var secret = request.resource.replace('/', "");

	validateConnection(secret);

	connection.on('message', function(message){

		var req = JSON.parse(message.utf8Data);

		//console.log(req.service + " " + req.action + "\n");

		switch(req.service){

			case "comStatus":
				updateComStatus(req.action);
				break;

			default:
				console.log(new Date() + " Error: invalid request" + "\n");
				break;
		}

	});

	connection.on('close', function(connection){

		//console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected." + "\n");

		if(connectionType == "panel"){
			panelClients.splice(panelIndex, 1);
		}
		else if(connectionType == "comStatus"){
			comStatusClients.splice(comIndex, 1);
		}
		else if(connectionType == "denied"){
			//do nothing
		}
		else{
			console.log(new Date() + " Error: invalid connectionType on close" + "\n");
		}

	});

});

startClientLoop();
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

//----------Server/App Config Variables----------//

var webSocketServerPort = 1450;


//Change these keys
var panelKey = "secret-panel-key";
var comStatusKey = "secret-comStatus-key";
var adminPanelKey = "secret-admin-panel-key";
var androidKey = "secret-android-key";



//This should match comStatus-client.js's timeInterval variable, panel-client intervals technically can be whatever;
var timeInterval = 600000;
var intervalThreshold = timeInterval / 2;


//---------------------------------------------------//

var webSocketServer = require('websocket').server;
var http = require('http');
var panelClients = [ ];
var comStatusClients = [ ];
var comStatusAddresses = [];
var mobStatusClients = [ ];
var mobStatusAddresses = [ ];
var connection, connectionType, comIndex, mobIndex, panelIndex;
 
//We don't need no state management library
var state = {

	"comStatus" : {
		"message" : "none",
		"status" : "off",
		"lastUpdate" : "",
		"connected" : "no"
	},
	"mobStatus" : {
		"message" : "none",
		"battery" : 0,
		"status" : "off",
		"lastUpdate": "",
		"connected" : "no",
	},
	"panelClients" : {
		"count" : 0
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

function printState(){
	console.log("---------" + "\n");
	console.log(state);
	console.log("\n" + "---------" + "\n");
}

function startClientLoop(){

	setInterval(function() {

		printState();
		updateClients();

	}, timeInterval);

}

function updateClients(){

	var toSend = {

		comStatus : {
			message : state.comStatus.message,
			status : state.comStatus.status
		},
		mobStatus : {
			message : state.mobStatus.message,
			status : state.mobStatus.status,
			battery : state.mobStatus.battery
		}
	};
	
	for(var i = 0; i < panelClients.length; i++){
		panelClients[i].send(JSON.stringify(toSend));
	}		

}



//Validate request then parse the message
wsServer.on('request', function(request){

	//---------Server Functions--------------------//

	function activateComStatus(){

		state.comStatus.status = "on";
		state.comStatus.lastUpdate = parseInt(new Date().getTime() / 1000);
	}

	function activateMobStatus(){

		state.mobStatus.status = "on";
		state.mobStatus.lastUpdate = parseInt(new Date().getTime() / 1000);
	}

	//Function to determine a comStatus connection timeout
	function checkComStatusConnection(){

		if(state.comStatus.connected === "yes"){
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
	}

	//Function to determine a mobStatus connection timeout
	function checkMobStatusConnection(){

		if(state.mobStatus.connected === "yes"){
			var now = parseInt(new Date().getTime() / 1000);

			//Has it been more than (intervalThreshold + timeInterval) seconds since an update?
			//then consider the client disconnected
			if(parseInt(now - state.mobStatus.lastUpdate) >= parseInt(intervalThreshold + timeInterval) / 1000 ){
				//console.log('comStatus computer disconnected!' + "\n");
				state.mobStatus.connected = "no";
				state.mobStatus.status = "off";
			}
			else{
				//console.log("time since update: " + parseInt(now - state.comStatus.lastUpdate) + " threshold is " + parseInt(intervalThreshold + timeInterval) / 1000 + "\n" );
			}
		}
	}

	function disconnectComStatus(){

		state.comStatus.status = "off";
		state.comStatus.connected = "no";
		state.comStatus.message = "none";
		state.comStatus.lastUpdate = "";
	}

	function disconnectMobStatus(){
		state.mobStatus.status = "off";
		state.mobStatus.connected = "no";
		state.mobStatus.message = "none";
		state.mobStatus.battery = 0;
		state.mobStatus.lastUpdate = "";
	}

	function sendConfirmation(type){

		var toSend = {
			"status" : "connected"
		}

		if(type === "comStatus"){
			comStatusClients[comIndex].send(JSON.stringify(toSend));
		}
		else if(type === "mobStatus"){
			mobStatusClients[mobIndex].send(JSON.stringify(toSend));
		}
		else if(type === "panel"){
			panelClients[panelIndex].send(JSON.stringify(toSend));
		}
	}


	//Endlessly checks for a comStatus connection time out based on timeInterval
	function startComStatusTimeOut(){

		if(state.comStatus.connected === "yes"){


			var comTimeOut = setInterval( function(){
				
				checkComStatusConnection();

				if(state.comStatus.connected === "no"){
					clearInterval(comTimeOut);
				}
			}, timeInterval);
		}
	}

	//Endlessly checks for a mobStatus connection time out based on timeInterval
	function startMobStatusTimeOut(){

		if(state.mobStatus.connected === "yes"){


			var mobTimeOut = setInterval( function(){
				
				checkMobStatusConnection();

				if(state.mobStatus.connected === "no"){
					clearInterval(mobTimeOut);
					connection.close();
				}
			}, timeInterval);
		}
	}

	function updateComStatus(action){

		switch(action){

			case "activate":
				activateComStatus();
				break;

			default:
				console.log(new Date() + "Error: unknown comStatus Action." + "\n");
				break;
		}
	}

	function updateMobStatus(action, message, battery){

		switch(action){

			case "activate":
				activateMobStatus();
				break;

			default:
				console.log(new Date() + "Error: unknown mobStatus Action." + "\n");
				break;	
		}

		if(message !== ""){
			state.mobStatus.message = message;
		}

		if(battery && battery !== 0){
			state.mobStatus.battery = battery;
		}

	}

	function updateNewClient(index){

		if(panelClients.length > 0){

			var toSend = {

				comStatus : {
					message : state.comStatus.message,
					status : state.comStatus.status
				},
				mobStatus : {
					message : state.mobStatus.message,
					status : state.mobStatus.status,
					battery : state.mobStatus.battery
				}
					
			};

			panelClients[index].send(JSON.stringify(toSend));
		}

	}

	function validateConnection(secret, address){

		if(secret === comStatusKey){

			if(state.comStatus.connected === "yes"){

				if(comStatusAddresses[comStatusAddresses.length] === address){
					activateComStatus();
					sendConfirmation("comStatus");
				}
			}
			else if(state.comStatus.connected === "no"){

				//console.log('Valid comStatus Request!' + "\n");
				connection = request.accept('echo-protocol', request.origin);
				comIndex = comStatusClients.push(connection) - 1;
				comStatusAddresses.push(address);
				state.comStatus.connected = "yes";
				connectionType = "comStatus";
				sendConfirmation("comStatus");
				startComStatusTimeOut();
			}
			
		}
		else if(secret === androidKey){

			if(state.mobStatus.connected === "yes"){

				if(mobStatusAddresses[mobStatusAddresses.length] === address){
					activateMobStatus();
					sendConfirmation("mobStatus");
				}
			}
			if(state.mobStatus.connected === "no"){
				//console.log('Valid mobStatus Request!' + "\n");
				connection = request.accept('', request.origin);
				mobIndex = mobStatusClients.push(connection) - 1;
				mobStatusAddresses.push(address);
				state.mobStatus.connected = "yes";
				connectionType = "mobStatus";
				sendConfirmation("mobStatus");
				startMobStatusTimeOut();
			}
			
		}
		else if(secret === panelKey){
			//console.log('Valid Panel Request' + "\n");
			connection = request.accept('echo-protocol', request.origin);
			panelIndex = panelClients.push(connection) - 1;
			state.panelClients.count++;
			updateNewClient(panelIndex);
			connectionType = "panel";
		}

		else if(secret === adminPanelKey){
			//console.log('Valid Admin Panel Request' + "\n");
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

	//console.log((new Date()) + ' Connection with key: ' + request.resource + " and origin: " +request.remoteAddress+ "\n");

	var secret = request.resource.replace('/', "");

	validateConnection(secret, request.remoteAddress);

	connection.on('message', function(message){

		var req = JSON.parse(message.utf8Data);

		//console.log(req.service + " " + req.action + "\n");

		switch(req.service){

			case "comStatus":
				updateComStatus(req.action);
				break;

			case "mobStatus":
				updateMobStatus(req.action, req.message, req.battery);
				break;

			default:
				console.log(new Date() + " Error: invalid request" + "\n");
				break;
		}

	});

	connection.on('close', function(connection){

		//console.log((new Date()) + " " +connectionType + " user disconnected." + "\n");

		if(connectionType == "panel"){
			state.panelClients.count--;
			panelClients.splice(panelIndex, 1);
		}
		else if(connectionType == "comStatus"){
			comStatusClients.splice(comIndex, 1);
			comStatusAddresses.splice(comIndex, 1);
			disconnectComStatus();
		}
		else if(connectionType == "mobStatus"){
			mobStatusClients.splice(mobIndex, 1);
			mobStatusAddresses.splice(mobIndex, 1);
			disconnectMobStatus();
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

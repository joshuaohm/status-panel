"use strict";

/*
*	Status Panel - Com Status Client - Joshua Ohm, 2017
*
*	Basic Script To tell Node.JS server this computer is On
*
*	I'm using qckwinsvc (https://github.com/tallesl/qckwinsvc)
*	to turn this script into a windows service that runs while my computer is on
*
*		npm install -g qckwinsvc
*
*		qckwinsvc and follow the prompts to install (it asks for a name, then a description, then a path to the script)
*
*		qckwinsvc --uninstall and follow the prompts to uninstall the service
*
*	Use this at your own risk. Make sure you replace the secret keys, be smart about security, etc. 
*
*/


var WebSocketClient = require("websocket").client;
var socket = new WebSocketClient();

//Change this IP/Key
var connectionString = "192.168.0.114:1450/secret-comStatus-key";

//This should match server.js's timeInterval variable;
var timeInterval = 6000;

socket.on('connectFailed', function(error){

	console.log('Error connecting to server:');
	console.log(error);

});

socket.on('connect', function (connection){

	//Endlessly sends comStatus updates based on timeInterval value
	function loopUpdates(){

		setInterval(function(){

			sendComStatus(false);
		}, timeInterval);	
	}

	//Tells the server this computer is on.
	function sendComStatus(flag){


		if(connection.connected){


			//console.log('sending message');

			var toSend = {
				service : 'comStatus',
				action: 'activate'
			};

			connection.send(JSON.stringify(toSend));

			//Only activate the endless loop once
			flag === true ? loopUpdates() : '';
		}
	}
	
	//console.log('Connected to server.');

	sendComStatus(true);

	connection.on('error', function(error){

		console.log('Error connecting to server.');
		console.log(error);
	});

	connection.on('close', function(){

		//console.log('Connection with server closed.');
	});

	connection.on('message', function(message){

		try{
			var msg = JSON.parse(message.data);

			//console.log(msg);
		}
		catch (e){
			console.log('Failed to parse message from server:');
			console.log(e);
			return;
		}

	});
});

	socket.connect("ws://"+connectionString, "echo-protocol");

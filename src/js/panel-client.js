/*
*	Status Panel - Panel Client - Joshua Ohm, 2017
*
*	Allows users (mostly me) to see information about various devices they (I) own.
*
*	Use this at your own risk. Make sure you replace the secret keys, be smart about security, etc. 
*
*/


(function(){


	//Change this IP/Key
	var connectionString = "192.168.0.114:1450/secret-panel-key";

	function connectToServer(){

		//--------Begin Client Functions----------//

		function updatePanel(state){

			//console.log(state);

			var comStatus = document.getElementsByClassName('computer-status')[0];

			if(state.message !== "none"){
				document.getElementById('comStatusMessage').innerHTML = state.message;
			}
			if(state.status === "on"){

				document.getElementById('comStatus').innerHTML = "ONLINE";				
				comStatus.classList.remove('off');
				comStatus.classList.add('on');
			}
			else if(state.status === "off"){
				document.getElementById('comStatus').innerHTML = "OFFLINE";
				comStatus.classList.remove('on');
				comStatus.classList.add('off');
			}
			else if(state.status === "error"){
				document.getElementById('comStatus').innerHTML = "ERROR CONNECTING";
				comStatus.classList.remove('on');
				comStatus.classList.remove('off');
			}

		}


		//--------End Client Functions----------//



		//--------Begin Connection Logic----------//

		window.WebSocket = window.WebSocket || window.MozWebSocket;

		var connection = new WebSocket("ws://"+connectionString, "echo-protocol");

		connection.onopen = function (){
			//console.log('connected to server' + "\n");
		};

		connection.onerror = function(error){
			console.log(error);

			var state = { message : "none", status : "error" };
			updatePanel(state);
		}

		connection.onmessage = function(message){

			try{
				var data = JSON.parse(message.data);
				updatePanel(data);
			}
			catch(e){
				console.log(e);
				return;
			}

		}

	}

	connectToServer();

})();
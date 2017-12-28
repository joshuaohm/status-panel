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

		function updateComStatus(state){

			var com = document.getElementsByClassName('computer-status')[0];

			if(state.comStatus.message !== "none"){
				document.getElementById('comStatusMessage').innerHTML = state.message;
			}
			if(state.comStatus.status === "on"){

				document.getElementById('comStatus').innerHTML = "ONLINE";				
				com.classList.remove('off');
				com.classList.add('on');
			}
			else if(state.comStatus.status === "off"){
				document.getElementById('comStatus').innerHTML = "OFFLINE";
				com.classList.remove('on');
				com.classList.add('off');
			}

		}

		function updateMobStatus(state){

			var mob = document.getElementsByClassName('mobile-status')[0];

			if(state.mobStatus.message !== "none" && state.mobStatus.message !== ""){
				document.getElementById('mobStatusMessage').innerHTML = state.mobStatus.message;
			}
			else{
				document.getElementById('mobStatusMessage').innerHTML = "No Message";
			}

			if(state.mobStatus.status === "on"){

				document.getElementById('mobStatus').innerHTML = "ONLINE";				
				mob.classList.remove('off');
				mob.classList.add('on');
			}
			else if(state.mobStatus.status === "off"){
				document.getElementById('mobStatus').innerHTML = "OFFLINE";
				mob.classList.remove('on');
				mob.classList.add('off');
			}

			if(state.mobStatus.battery !== 0 && state.mobStatus.battery){

				document.getElementById('mobStatus').innerHTML = state.mobStatus.battery + "%";
			}

		}

		function updatePanel(state){

			console.log(state);

			updateComStatus(state);
			updateMobStatus(state);
			
			if(state.status === "error"){
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
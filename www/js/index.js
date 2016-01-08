/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var deviceId;
var deviceName;
var deviceConnected=false;
 
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
		ble.isEnabled(
			function() {
				console.log("Bluetooth is enabled");
			},
			function() {
				console.log("Bluetooth is not enabled");
				console.log("Intent to enable Bluetooth");
				app.turnOnBluetooth();
			}
		);
		scanButton.addEventListener('click',app.scanbtn_onClick,false);
		sendButton.addEventListener('click',app.sendbtn_onClick,false);
		deviceList.addEventListener('click',app.deviceList_onClick,false);
    },
    // Update DOM on a Received Event
	turnOnBluetooth: function() {
		ble.enable(
			function() {
				console.log("Bluetooth is enabled");
			},
			function() {
				console.log("Bluetooth can't be enabled");
			}
		);
	},
	scanbtn_onClick: function() {
		if(deviceConnected){
			ble.disconnect(deviceId,
				function(){
					console.log("BLE disconnected");
					scanButton.innerHTML="Scan";
					deviceStatus.innerHTML="No connection";
					deviceConnected=false;
				},
				function() {
					console.log("BLE disconnect failed");
				}
			);
		} else {
			console.log("Scan BLE");
			page1.style.display='none';
			page2.style.display='block';
			while(deviceList.hasChildNodes()) {
				deviceList.removeChild(deviceList.firstChild);
			}
			ble.scan([],5,app.bleDiscoverDevice,
				function() {
					alert("BLE scan error");
				}
			)
		}
	},
	bleDiscoverDevice: function(device) {
		var listItem = document.createElement('li')
		html = '<b>' + device.name + '</b><br/>' +
                'RSSI: ' + device.rssi + '&nbsp;|&nbsp;' +
                device.id;

		listItem.dataset.deviceId = device.id;  // TODO
		listItem.dataset.deviceName=device.name;
		listItem.innerHTML = html;
		deviceList.appendChild(listItem);
	},
	deviceList_onClick: function(e) {
		deviceId=e.target.dataset.deviceId;
		deviceName=e.target.dataset.deviceName;
		ble.connect(deviceId,app.bleConnected,
			function() {
				console.log("BLE connection failed");
			}
		);
	},
	bleConnected: function() {
		var i;
		console.log("BLE connected");
		console.log("UUID:"+deviceId);
		page1.style.display='block';
		page2.style.display='none';
		scanButton.innerHTML="Disconnect";
		deviceStatus.innerHTML=deviceName;
		deviceConnected=true;
		ble.startNotification(deviceId,"ffe0","ffe1",app.bleReceived,
			function(){
				console.log("Read failed");
			}
		);
	},
	bleReceived: function(buffer){
		console.log(buffer);
		var data=new Uint8Array(buffer);
		receiveBox.value=receiveBox.value+String.fromCharCode.apply(null,data);
	},
	sendbtn_onClick: function() {
		var i;
		var data=new Uint8Array(sendBox.value.length+2);
		console.log("Send:"+sendBox.value);
		for(i=0;i<sendBox.value.length;i++){
			data[i]=sendBox.value.charCodeAt(i);
		}
		data[i]=0x0d;
		data[i+1]=0x0a;
		ble.writeWithoutResponse(deviceId,"ffe0","ffe1",data.buffer,
			function() {
				console.log("write success");
			},
			function() {
				console.log("write failed");
			}
		);
		sendBox.value='';
	}
};

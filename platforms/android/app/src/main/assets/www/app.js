
// Application object.
var app = {};

// Active tabs
app.basicConfigTab = null;
app.advancedConfigTab = null;

// Device list.
app.devices = {};
app.connectErrorCount = 0;
app.connectedDevice = null;
app.searchDevicesErrorBar = null;
app.searchDevicesInfoBar = null;
app.batteryErrorBar = null;
app.radioErrorBar = null;
app.radioSuccessBar = null;
app.sirapErrorBar = null;
app.sirapSuccessBar = null;
app.networkErrorBar = null;
app.networkSuccessBar = null;
app.miscDeviceNameErrorBar = null;
app.miscDeviceNameSuccessBar = null;
app.miscStatusErrorBar = null;
app.miscSettingsErrorBar = null;
app.miscSettingsSuccessBar = null;
app.miscServicesErrorBar = null;
app.miscDatabaseErrorBar = null;
app.miscDatabaseSuccessBar = null;
app.miscDatabaseAdvErrorBar = null;
app.miscDatabaseAdvSuccessBar = null;
app.miscRadioAdvErrorBar = null;
app.miscRadioAdvSuccessBar = null;
app.miscTestPunchesSuccessBar = null;
app.miscTestPunchesErrorBar = null;
app.miscUpdateErrorBar = null;
app.miscUpdateInfoBar = null;
app.miscSportIdentErrorBar = null;
app.miscSportIdentSuccessBar = null;


app.apiServiceForFilter =                      '08562e1c-cc14-f0a8-a240-b24a000988fb';
app.apiService =                               'fb880900-4ab2-40a2-a8f0-14cc1c2e5608';

app.propertyCharacteristic =                    'fb880912-4ab2-40a2-a8f0-14cc1c2e5608';
app.commandCharacteristic =                     'fb880913-4ab2-40a2-a8f0-14cc1c2e5608';
app.punchesCharacteristic =              'fb880901-4ab2-40a2-a8f0-14cc1c2e5608';  //N: subscribe to punches
app.testPunchesCharacteristic =          'fb880907-4ab2-40a2-a8f0-14cc1c2e5608';  //N,R,W: test sending punches, subscribe, periodic

app.isScanning = false;
app.servicesDiscovered = false;
app.backendApiKey = '67f11087-32c5-4dc5-9987-bbdecb028d36';

// UI methods.
app.ui = {};
app.ui.chip = 'RF1276T';
app.ui.radio = {};
app.ui.radio.channel = null;
app.ui.radio.range = null;
app.ui.radio.acknowledgementRequested = null;
app.ui.radio.power = null;
app.ui.sirap = {};
app.ui.sirap.sendToSirapEnabled = null;
app.ui.sirap.sendToSirapIP = null;
app.ui.sirap.sendToSirapIPPort = null;
app.ui.misc = {};
app.ui.misc.deviceName = null;
app.ui.misc.noOfTestPunchesToSend = null;
app.ui.sportident = {}
app.ui.sportident.oneway = null;
app.ui.sportident.force4800 = null;
app.ui.update = {};
app.ui.update.wiRocBLEVersion = null;
app.ui.update.wiRocPythonVersion = null;

// Timer that updates the device list and removes inactive
// devices in case no devices are found by scan.
app.ui.updateTimer = null;

app.punches = null;
app.testPunches = null;
app.commandResponse = null;
app.propertyResponse = null;
app.wirocSettings = null;

app.initialize = function()
{
	document.addEventListener(
		'deviceready',
		function() { scriptsLoaded(app.onDeviceReady); },
		false);
};

app.onDeviceReady = function()
{
	console.log('device ready');
	$(":mobile-pagecontainer").pagecontainer( "change", "#page-device-scan", { } );
	//app.ui.showChannelPage();
};

app.ui.onScanButton = function() {
	$('#scan-status').html('test');
	if (!app.isScanning) {
		app.isScanning = true;
		$('.scan-button').html('Stop scan');
		app.disconnect();
		app.devices = {};
		app.ui.displayDeviceList();
		app.ui.displayStatus('Scanning...');
		console.log(evothings.ble);
		evothings.ble.startScan(
			app.ui.deviceFound,
			app.ui.scanError,
			{});
		app.ui.updateTimer = setInterval(app.ui.displayDeviceList, 500);
	} else {
		app.stopScan();
	}
};

app.stopScan = function() {
	app.isScanning = false;
	$('.scan-button').html('Start scan');
	evothings.ble.stopScan();
	app.ui.displayStatus('Scan stopped');
	clearInterval(app.ui.updateTimer);
};



// Called when a device is found.
app.ui.deviceFound = function(device) //, errorCode)
{
	//console.log("device: " + JSON.stringify(device));
	//console.log("device.advertisementData" + device.advertisementData);
	//console.log("device.advertisementData connectable" + device.advertisementData.kCBAdvDataIsConnectable);
	//console.log("device.advertisementData.kCBAdvDataServiceUUIDs" + device.advertisementData.kCBAdvDataServiceUUIDs);
	console.log('device:' + JSON.stringify(device));
	var advertisedServiceUUIDs = device.advertisementData.kCBAdvDataServiceUUIDs;
	if (advertisedServiceUUIDs && advertisedServiceUUIDs.indexOf(app.apiServiceForFilter) > -1)
	{
		// Set timestamp for device (this is used to remove inactive devices).
		device.timeStamp = Date.now();
		// Insert the device into table of found devices.
		app.devices[device.address] = device;
	}
};


app.ui.scanError = function(errorCode)
{
	app.ui.displayStatus('Scan Error: ' + errorCode);
};

app.ui.updateBackgroundColor = function()
{
	// radio
	if (app.ui.radio.channel != app.ui.getChannel() || 
		(app.ui.radio.range != app.ui.getRange()))
	{
		$('#radio').css('background-color','#FFEFD5');
	} else {
		$('#radio').css('background-color','white');
	}
	// sirap
	if (app.ui.sirap.sendToSirapEnabled != app.ui.getSendToSirapEnabled() || app.ui.sirap.sendToSirapIP != app.ui.getSendToSirapIP() || app.ui.sirap.sendToSirapIPPort != app.ui.getSendToSirapIPPort())
	{
		$('#sirap').css('background-color','#FFEFD5');
	} else {
		$('#sirap').css('background-color','white');
	}
	// device name
	if (app.ui.misc.deviceName != app.ui.getWiRocDeviceName())
	{
		$('#devicename').css('background-color','#FFEFD5');
	} else {
		$('#devicename').css('background-color','white');
	}
	// radio adv
	//console.log('updatebackgroundcolor - acknowledgementRequested: ' + app.ui.radio.acknowledgementRequested);
 	//console.log('updatebackgroundcolor - getAcknowledgementRequested: ' + app.ui.getAcknowledgementRequested());
	//console.log('updatebackgroundcolor - power: ' + app.ui.radio.power);
 	//console.log('updatebackgroundcolor - getPower: ' + app.ui.getPower());

	if (app.ui.radio.acknowledgementRequested != app.ui.getAcknowledgementRequested() 
		|| app.ui.radio.power != app.ui.getPower())
	{
		$('#radio-adv').css('background-color','#FFEFD5');
	} else {
		$('#radio-adv').css('background-color','white');
	}
	// sportident
	if (app.ui.sportident.oneway != app.ui.getOneWay() || app.ui.sportident.force4800 != app.ui.getForce4800())
	{
		$('#sportident').css('background-color','#FFEFD5');
	} else {
		$('#sportident').css('background-color','white');
	}
	// update
	if (app.ui.update.wiRocPythonVersion != app.ui.getUpdateWiRocPython() || app.ui.update.wiRocBLEVersion != app.ui.getUpdateWiRocBLE())
	{
		$('#update-adv').css('background-color','#FFEFD5');
	} else {
		$('#update-adv').css('background-color','white');
	}
};


// Display the device list.
app.ui.displayDeviceList = function()
{
	// Clear device list.
	$('#found-devices').empty();

	var timeNow = Date.now();
	$.each(app.devices, function(key, device)
	{
		// Only show devices that are updated during the last 10 seconds.
		if (device.timeStamp + 10000 > timeNow)
		{
			// Map the RSSI value to a width in percent for the indicator.
			var rssiWidth = 100; // Used when RSSI is zero or greater.
			if (device.rssi < -120) { rssiWidth = 0; }
			else if (device.rssi < 0) 
			{ 
				rssiWidth = 120 + device.rssi; 
				if (rssiWidth > 100) { rssiWidth = 100; }
			}

			// Create tag for device data.
			var element = $(
				'<li style="padding:10px" class="device">'
				+	'<span class="device-header">' + device.name + '</span>'
				+   '<a href="#" style="float:right" class="ui-btn connect-button">CONNECT</a>'
				+   '<table style="border:0px;padding:0px;width:100%;">'
				+     '<tr>'
				+       '<td style="white-space:nowrap;">Bluetooth addr:</td>'
				+       '<td>' + device.address + '</td>'
				+     '</tr>'
				+     '<tr>'
				+       '<td style="white-space:nowrap;">Signal ' + device.rssi + ' dBm</td>'
				+       '<td style="background:rgb(150,150,150);margin:0px;padding:4px">'
				+          '<div style="background:#3388cc;height:20px;width:'+rssiWidth+'%;"></div>'
				+       '</td>'
				+     '</tr>'
				+   '</table>'
				+ '</li>'
			);
			
			element.find('a.connect-button').bind("click",
				{address: device.address, name: device.name},
				app.ui.onConnectButton);

			$('#found-devices').append(element);
		}
	});
};

// Display a status message
app.ui.displayStatus = function(message)
{
	$('#scan-status').html(message);
};

app.ui.onConnectButton = function(event) {
	app.stopScan(); // should this be here?
	app.connectErrorCount = 0;
	app.btAddressToConnect = event.data.address;
	app.connect(app.devices[event.data.address]);
};

// Hide/show depending on chip
app.ui.displayChip = function(chip)
{
	app.ui.chip = chip;
	if (chip == 'RF1276T') {
		$('#main-RF1276T').show();
		$('#main-DRF1268DS').hide();
		$('#radio-adv-RF1276T').show();
		$('#radio-adv-DRF1268DS').hide();
	} else {
		$('#main-DRF1268DS').show();
		$('#main-RF1276T').hide();
		$('#radio-adv-DRF1268DS').show();
		$('#radio-adv-RF1276T').hide();
	}
};

// Channel
app.ui.displayChannel = function(channel)
{
	//console.log("displayChannel");
	app.ui.radio.channel = channel;

	// Select the relevant option, de-select any others
	$('#channel-select-' + app.ui.chip).val(channel).attr('selected', true).siblings('option').removeAttr('selected');

	// jQM refresh
	$('#channel-select-' + app.ui.chip).selectmenu("refresh", true);
	app.ui.updateBackgroundColor();
};

app.getChannel = function(callback)
{
	//console.log('getchannel');
	app.writeProperty('channel', null, 
		callback,
		function(error) {
			app.radioErrorBar.show({
				html: 'Error getting radio setting (Channel): ' + error
			});
		}
	);
};

app.ui.getChannel = function() {
	var value = $("#channel-select-" + app.ui.chip + " option:selected").val();
	return value;
};

app.writeChannel = function(callback)
{
	app.writeProperty('channel', app.ui.getChannel(), 
		callback,
		function(error) {
			console.log('writechannel error: ' + error);
			app.radioErrorBar.show({
				html: 'Error saving radio setting (Channel): ' + error
			});
		}
	);
};

//
app.ui.displayWarningNotes = function(chip, ackReq, power, siOneWay)
{
	//app.radioErrorBar.show({ html: (chip==null?'null':chip) +':'+(ackReq==null?'null':ackReq) +':'+(power==null?'null':power)+':'+(siOneWay==null?'null':siOneWay) });
	if (ackReq != null) {
		if (ackReq == '1') {
			$('#warning-note-req-ack').hide();
		} else {
			$('#warning-note-req-ack').show();
		}
	}
	if (power != null && chip != null) {
		if ((chip == 'RF1276T' && power == 7) ||
			(chip != 'RF1276T' && power == 22)) {
			$('#warning-note-radio-power').hide();
		} else {
			$('#warning-note-radio-power').show();
		}
	}
	if (siOneWay != null) {
		if (siOneWay == '1') {
			$('#warning-note-si-one-way').show();
		} else {
			$('#warning-note-si-one-way').hide();
		}
	}
};



//---- ack

app.getAcknowledgementRequested = function(callback)
{
	app.writeProperty('acknowledgementrequested', null, 
		callback,
		function(error) {
			app.miscRadioAdvErrorBar.show({
				html: 'Error getting radio settings (Acknowledgement): ' + error,
			});
		}
	);
};


app.ui.getAcknowledgementRequested = function() {
	return $('#acknowledgement').prop("checked") ? 1 : 0;
};

app.writeAcknowledgementRequested = function(callback)
{
	var ack = app.ui.getAcknowledgementRequested();
	app.writeProperty('acknowledgementrequested', ack.toString(), 
		callback,
		function(error) {
			app.miscRadioAdvErrorBar.show({
				html: 'Error saving radio setting (Acknowledgement): ' + error,
			});
		}
	);
};

app.ui.displayAcknowledgementRequested = function(acknowledgement)
{
	var raw = parseInt(acknowledgement);
	app.ui.radio.acknowledgementRequested = raw;
    $('#acknowledgement').checkboxradio();
	$('#acknowledgement').prop("checked",raw != 0).checkboxradio("refresh");
	app.ui.displayWarningNotes(app.ui.chip, acknowledgement, null, null);
	app.ui.updateBackgroundColor();
};


//-- Power

app.ui.displayPower = function(power)
{
	//console.log("displayPower");
	var raw = parseInt(power);
	app.ui.radio.power = raw;
	
	if (app.ui.chip == 'RF1276T' && raw > 0x07) {
		raw = 0x07; // max power for this chip 0x07. 
	}
		
	// Select the relevant option, de-select any others
	$('#lorapower-select-' + app.ui.chip).val(raw).attr('selected', true).siblings('option').removeAttr('selected');

	// jQM refresh
	var w = $("#lorapower-select-" + app.ui.chip);
	if( w.data("mobile-selectmenu") === undefined) {
		// not initialized yet, lets do so
		w.selectmenu({ nativeMenu: false });
	}

	$('#lorapower-select-' + app.ui.chip).selectmenu("refresh", true);
	
	app.ui.displayWarningNotes(app.ui.chip, null, raw, null);
	
	app.ui.updateBackgroundColor();
};


app.getPower = function(callback)
{
	app.writeProperty('power', null, 
		callback,
		function(error) {
			app.miscRadioAdvErrorBar.show({
				html: 'Error getting radio setting (Power): ' + error
			});
		}
	);
};

app.ui.getPower = function() {
	var value = $('#lorapower-select-' +  app.ui.chip + ' option:selected').val();
	return value;
};

app.writePower = function(callback)
{
    var power = app.ui.getPower();
	app.writeProperty('power', power, 
		callback,
		function(error) {
			app.miscRadioAdvErrorBar.show({
				html: 'Error saving radio setting (Power): ' + error
			});
		}
	);
};

//-- Range

app.ui.displayRange = function(rangeString)
{
	//console.log("displayRange");
	app.ui.radio.range = rangeString;
	
	$(".datarate-" + app.ui.chip + " [type='radio'][value = '" + rangeString + "']").prop("checked", true).checkboxradio("refresh");
	$(".datarate-" + app.ui.chip + " [type='radio']").not( "[value = '" + rangeString + "']").prop("checked", false).checkboxradio("refresh");
	app.ui.updateBackgroundColor();
};


app.getRange = function(callback)
{
    app.writeProperty('lorarange', null, 
		callback,
		function(error) {
			app.radioErrorBar.show({
				html: 'Error getting radio setting (Range): ' + error
			});
		}
	);
};

app.ui.getRange = function() {
	var selected = $(".datarate-" + app.ui.chip + " [type='radio']:checked");
	return selected.val();
};

app.writeRange = function(callback)
{
    app.writeProperty('lorarange', app.ui.getRange(), 
		callback,
		function(error) {
			app.radioErrorBar.show({
				html: 'Error saving radio setting (Range): ' + error
			});
		}
	);
};

//-- Update WiRoc Python

app.ui.onUpdateWiRocPython = function(event)
{
	app.writeUpdateWiRocPython(function() {
		app.miscUpdateInfoBar.show({
    		html: 'Sent update command'
		});
	});
};

app.getWiRocPythonVersionsFromGithub = function(callback) {
	var url = 'https://api.github.com/repos/henla464/WiRoc-Python-2/releases';
	if (window.cordova) {
		// do something cordova style
		cordovaHTTP.get(
		   url,
		   {},
		   { Accept: 'application/json',
			credentials: 'same-origin' },
		   function (response) {
			  if (response) {
				console.log('get python versions: ' + response.data);
				var versionsJson = JSON.parse(response.data);
				var versionsArray = [];
				for (var i = 0; i < 5; i++) {
					versionsArray.push(versionsJson[i].tag_name);
				}
				callback(versionsArray);
				return;
			  }
			callback(null);
		   },
		   function (error) {
			  console.log(JSON.stringify(error));
		   }
		);
	} else {
		return fetch(url,
		{
			credentials: 'same-origin',
			headers: {
			  'Accept': 'application/json'
			},
			method: "GET"
		})
		.then(function(res) { 
			console.log('get versions');
			return res.json();
		}).then(function (versionsJson) {
			var versionsArray = [];
			for (var i = 0; i < 5; i++) {
				versionsArray.push(versionsJson[i].tag_name);
			}
			return versionsArray;
		})
		.catch(function(res){ console.log(res); });
	}
};

app.getWiRocPythonLatestVersionFromGithub = function(callback) {
	var url = 'https://api.github.com/repos/henla464/WiRoc-Python-2/releases/latest';
	if (window.cordova) 
	{
		cordovaHTTP.get(
		   url,
		   {},
		   { Accept: 'application/json',
			credentials: 'same-origin' },
		   function (response) {
			if (response) {
				console.log('get python latest version: ' + response.data);
				var latest = JSON.parse(response.data);
				if (latest.tag_name) {
					callback(latest.tag_name);
					return;
				}
			}
			callback(null);
		   },
		   function (error) {
			  console.log(JSON.stringify(error));
		   }
		);
	} else {
		return fetch(url,
		{
			credentials: 'same-origin',
			headers: {
			  'Accept': 'application/json',
			},
			method: "GET"
		})
		.then(function(res) { 
			console.log('get latest');
			return res.json();
		}).then(function (versionObj) {
			if (versionObj.tag_name) {
				return versionObj.tag_name;
			}
			return null;
		})
		.catch(function(res){ console.log(res); });
	}
};


app.ui.displayUpdateWiRocPython = function(wirocPythonVersion)
{
	console.log("displayWiRocPython");
	if (wirocPythonVersion != null) {
	    app.ui.update.wiRocPythonVersion = wirocPythonVersion;
    }
	// load content
	if (window.cordova) {
		app.getWiRocPythonLatestVersionFromGithub(function(latest) {
			console.log(latest);
			app.getWiRocPythonVersionsFromGithub(function(versions) {
				console.log(versions);
				var versionOptions = [];
				$.each(versions, function(index, version) {
					if (version != latest) {
						versionOptions.push('<option value="' +version+ '">'+version+' developer release</option>');
					}
				});
			
				$("#wirocpythonversions-select").remove().end();
				var selectpython = $("<select name=\"wirocpythonversions\" id=\"wirocpythonversions-select\" data-native-menu=\"true\"></select>");
				selectpython.find('option').remove().end();
				if (latest != null) {
					var latestOpt = '<option value="' +latest+ '">'+latest+' Official release</option>';
					$(latestOpt).appendTo(selectpython);
				}
			
				$.each(versionOptions, function(index, versionOpt) {
					$(versionOpt).appendTo(selectpython);
				});
				
				var wirocPythonVersionExistsInList = false;
				var checkIfVersionExists = function() {
					if (this.value == app.ui.update.wiRocPythonVersion) {
						wirocPythonVersionExistsInList = true;
					}
				}
				selectpython.find('option').each(checkIfVersionExists);
					
				if (!wirocPythonVersionExistsInList) {
					var currentVersionOpt = '<option value="' +app.ui.update.wiRocPythonVersion+ '">'+app.ui.update.wiRocPythonVersion+'</option>';
					$(currentVersionOpt).appendTo(selectpython);
				}
				
				var parentDiv = $("div.updatewirocpython");
				selectpython.appendTo(parentDiv);
				// jQM refresh
				if( selectpython.data("mobile-selectmenu") === undefined) {
					// not initialized yet, lets do so
					console.log("init selectmenu python");
					selectpython.selectmenu({ nativeMenu: true });
				}
				selectpython.val(app.ui.update.wiRocPythonVersion).attr('selected', true).siblings('option').removeAttr('selected');
				selectpython.selectmenu("refresh", true);
			});
		});
	} else {
		var latestPromise = app.getWiRocPythonLatestVersionFromGithub();
		latestPromise.then(function(latest) {
			console.log(latest);
			var versionsPromise = app.getWiRocPythonVersionsFromGithub();
			versionsPromise.then(function(versions) {
				console.log(versions);
				var versionOptions = [];
				$.each(versions, function(index, version) {
					if (version != latest) {
						versionOptions.push('<option value="' +version+ '">'+version+' developer release</option>');
					}
				});
			
				$("#wirocpythonversions-select").remove().end();
				var selectpython = $("<select name=\"wirocpythonversions\" id=\"wirocpythonversions-select\" data-native-menu=\"true\"></select>");
				selectpython.find('option').remove().end();
				if (latest != null) {
					var latestOpt = '<option value="' +latest+ '">'+latest+' Official release</option>';
					$(latestOpt).appendTo(selectpython);
				}
			
				$.each(versionOptions, function(index, versionOpt) {
					$(versionOpt).appendTo(selectpython);
				});
				
				var wirocPythonVersionExistsInList = false;
				var checkIfVersionExists = function() {
					if (this.value == app.ui.update.wiRocPythonVersion) {
						wirocPythonVersionExistsInList = true;
					}
				}
				selectpython.find('option').each(checkIfVersionExists);
				
				if (!wirocPythonVersionExistsInList) {
					var currentVersionOpt = '<option value="' +app.ui.update.wiRocPythonVersion+ '">'+app.ui.update.wiRocPythonVersion+'</option>';
					$(currentVersionOpt).appendTo(selectpython);
				}
			
				
				var parentDiv = $("div.updatewirocpython");
				selectpython.appendTo(parentDiv);
				// jQM refresh
				if( selectpython.data("mobile-selectmenu") === undefined) {
					// not initialized yet, lets do so
					console.log("init selectmenu python");
					selectpython.selectmenu({ nativeMenu: false });
				}
				selectpython.val(app.ui.update.wiRocPythonVersion).attr('selected', true).siblings('option').removeAttr('selected');
				selectpython.selectmenu("refresh", true);
			});
		});
	}
};

app.ui.getUpdateWiRocPython = function() {
	var value = $("#wirocpythonversions-select option:selected").val();
	return value;
};

app.writeUpdateWiRocPython = function(callback)
{
    console.log('writeUpdateWiRocPython');
	var version = app.ui.getUpdateWiRocPython();
    app.writeCommand('upgradewirocpython', version, 
		callback,
		function(error) {
			console.log('writeWiRocPython error: ' + error);
			app.updateErrorBar.show({
				html: 'Error sending Update: ' + error
			});
		}
	);
};

//-- Update WiRoc BLE

app.ui.onUpdateWiRocBLE = function(event)
{
	app.writeUpdateWiRocBLE(function() {
		app.miscUpdateInfoBar.show({
    		html: 'Sent update command'
		});
	});
};

app.getWiRocBLEVersionsFromGithub = function(callback) {
	var url = 'https://api.github.com/repos/henla464/WiRoc-BLE-Device/releases';
	if (window.cordova) {
		// do something cordova style
		cordovaHTTP.get(
		   url,
		   {},
		   { Accept: 'application/json',
			credentials: 'same-origin' },
		   function (response) {
			  if (response) {
				console.log('get ble versions: ' + response.data);
				var versionsJson = JSON.parse(response.data);
				var versionsArray = [];
				for (var i = 0; i < 5; i++) {
					versionsArray.push(versionsJson[i].tag_name);
				}
				callback(versionsArray);
				return;
			  }
			callback(null);
		   },
		   function (error) {
			  console.log(JSON.stringify(error));
		   }
		);
	} else {
		return fetch(url,
		{
			credentials: 'same-origin',
			headers: {
			  'Accept': 'application/json'
			},
			method: "GET"
		})
		.then(function(res) { 
			console.log('get versions');
			return res.json();
		}).then(function (versionsJson) {
			var versionsArray = [];
			for (var i = 0; i < 5; i++) {
				versionsArray.push(versionsJson[i].tag_name);
			}
			return versionsArray;
		})
		.catch(function(res){ console.log(res); });
	}
};

app.getWiRocBLELatestVersionFromGithub = function(callback) {
	var url = 'https://api.github.com/repos/henla464/WiRoc-BLE-Device/releases/latest';
	if (window.cordova) {
		// do something cordova style
		cordovaHTTP.get(
		   url,
		   {},
		   { Accept: 'application/json',
			credentials: 'same-origin' },
		   function (response) {
			  if (response) {
				console.log('get latest: ' + response.data);
				var versionObj = JSON.parse(response.data);
				if (versionObj.tag_name) {
					callback(versionObj.tag_name);
					return;
				}
			  }
			callback(null);
		   },
		   function (error) {
			  console.log(JSON.stringify(error));
		   }
		);
	}
	else {
		return fetch(url,
		{
			credentials: 'same-origin',
			headers: {
			  'Accept': 'application/json',
			},
			method: "GET"
		})
		.then(function(res) { 
			console.log('get latest');
			return res.json();
		}).then(function (versionObj) {
			if (versionObj.tag_name) {
				return versionObj.tag_name;
			}
			return null;
		})
		.catch(function(){ console.log('error fetching latest ble'); });
	}
};

app.ui.displayUpdateWiRocBLE = function(wirocBLEVersion)
{
	console.log("displayWiRocBLE");
	if (wirocBLEVersion != null) {
		app.ui.update.wiRocBLEVersion = wirocBLEVersion;
	}
	if (window.cordova) {
		app.getWiRocBLELatestVersionFromGithub(function(latest) {
			console.log(latest);
			app.getWiRocBLEVersionsFromGithub(function(versions) {
				console.log(versions);
				var versionOptions = [];
				$.each(versions, function(index, version) {
					if (version != latest) {
						versionOptions.push('<option value="' +version+ '">'+version+' developer release</option>');
					}
				});
						
				$("#wirocbleversions-select").remove().end();
				var selectble = $("<select name=\"wirocbleversions\" id=\"wirocbleversions-select\" data-native-menu=\"true\"></select>");
				selectble.find('option').remove().end();
				if (latest != null) {
					var latestOpt = '<option value="' +latest+ '">'+latest+' Official release</option>';
					$(latestOpt).appendTo(selectble);
				}
			
				$.each(versionOptions, function(index, versionOpt) {
					$(versionOpt).appendTo(selectble);
				});
			
				var wirocBLEVersionExistsInList = false;
				var checkIfVersionExists = function() {
					if (this.value == app.ui.update.wiRocBLEVersion) {
						wirocBLEVersionExistsInList = true;
					}
				}
				selectble.find('option').each(checkIfVersionExists);
	
				
				if (!wirocBLEVersionExistsInList) {
					var currentVersionOpt = '<option value="' +app.ui.update.wiRocBLEVersion+ '">'+app.ui.update.wiRocBLEVersion+'</option>';
					$(currentVersionOpt).appendTo(selectble);
				}
				
				var parentDiv = $("div.updatewirocble");
				selectble.appendTo(parentDiv);
				// jQM refresh
				if( selectble.data("mobile-selectmenu") === undefined) {
					// not initialized yet, lets do so
					console.log("init selectmenu ble");
					selectble.selectmenu({ nativeMenu: true });
				}
				
				// Select the relevant option, de-select any others
				selectble.val(app.ui.update.wiRocBLEVersion).attr('selected', true).siblings('option').removeAttr('selected');
				selectble.selectmenu("refresh", true);
			});
		});
	} else {
		// load content
		var latestPromise = app.getWiRocBLELatestVersionFromGithub();
		latestPromise.then(function(latest) {
			console.log(latest);
			var versionsPromise = app.getWiRocBLEVersionsFromGithub();
			versionsPromise.then(function(versions) {
				console.log(versions);
				var versionOptions = [];
				$.each(versions, function(index, version) {
					if (version != latest) {
						versionOptions.push('<option value="' +version+ '">'+version+' developer release</option>');
					}
				});
						
				$("#wirocbleversions-select").remove().end();
				var selectble = $("<select name=\"wirocbleversions\" id=\"wirocbleversions-select\" data-native-menu=\"true\"></select>");
				selectble.find('option').remove().end();
				if (latest != null) {
					var latestOpt = '<option value="' +latest+ '">'+latest+' Official release</option>';
					$(latestOpt).appendTo(selectble);
				}
			
				$.each(versionOptions, function(index, versionOpt) {
					$(versionOpt).appendTo(selectble);
				});
			
					var wirocBLEVersionExistsInList = false;
				var checkIfVersionExists = function() {
					if (this.value == app.ui.update.wiRocBLEVersion) {
						wirocBLEVersionExistsInList = true;
					}
				}
				selectble.find('option').each(checkIfVersionExists);
	
				if (!wirocBLEVersionExistsInList) {
					var currentVersionOpt = '<option value="' +app.ui.update.wiRocBLEVersion+ '">'+app.ui.update.wiRocBLEVersion+'</option>';
					$(currentVersionOpt).appendTo(selectble);
				}
				
				var parentDiv = $("div.updatewirocble");
				selectble.appendTo(parentDiv);
				// jQM refresh
				if( selectble.data("mobile-selectmenu") === undefined) {
					// not initialized yet, lets do so
					console.log("init selectmenu ble");
					selectble.selectmenu({ nativeMenu: true });
				}
				
				// Select the relevant option, de-select any others
				selectble.val(app.ui.update.wiRocBLEVersion).attr('selected', true).siblings('option').removeAttr('selected');
				selectble.selectmenu("refresh", true);
			});
		});
	}
};

app.ui.getUpdateWiRocBLE = function() {
	var value = $("#wirocbleversions-select option:selected").val();
	return value;
};

app.writeUpdateWiRocBLE = function(callback)
{
    console.log('writeWiRocBLE');
    var version = app.ui.getUpdateWiRocBLE();
    app.writeCommand('upgradewirocble', version, 
		callback,
		function(error) {
			console.log('writeWiRocBLE error: ' + error);
			app.updateErrorBar.show({
				html: 'Error sending update: ' + error
			});
		}
	);
};


//---- one-way
app.ui.enableDisableForce4800 = function() 
{
  app.ui.enableDisableForce4800WithParam(this.checked);
};

app.ui.enableDisableForce4800WithParam = function(oneWayChecked) 
{
  if (oneWayChecked) {
    $("#force-4800-bps").removeAttr("disabled");
    $('#force-4800-bps').prop("checked", false).checkboxradio("refresh");
  } else {
    $("#force-4800-bps").attr("disabled", true);
    $('#force-4800-bps').prop("checked", false).checkboxradio("refresh");
  }
};

app.getOneWay = function(callback)
{
	//console.log('getOneWay');
	app.writeProperty('onewayreceive', null, 
		callback,
		function(error) {
			app.miscSportIdentErrorBar.show({
				html: 'Error getting one-way: ' + error,
			});
		}
	);
};


app.ui.getOneWay = function() {
	return $('#sportident-oneway').prop("checked") ? 1 : 0;
};

app.writeOneWay = function(callback)
{
	var oneway = app.ui.getOneWay();
	app.writeProperty('onewayreceive', oneway.toString(), 
		callback,
		function(error) {
			app.miscSportIdentErrorBar.show({
				html: 'Error saving one-way: ' + error,
			});
		}
	);
};

app.ui.displayOneWay = function(oneway)
{
	var raw = parseInt(oneway);
	app.ui.sportident.oneway = raw;
    $('#sportident-oneway').checkboxradio();
	$('#sportident-oneway').prop("checked",raw != 0).checkboxradio("refresh");
	app.ui.enableDisableForce4800WithParam(raw != 0);
	
	app.ui.displayWarningNotes(app.ui.chip, null, null, oneway);
	
	app.ui.updateBackgroundColor();
};


//---- force4800

app.getForce4800 = function(callback)
{
	app.writeProperty('force4800baudrate', null, 
		callback,
		function(error) {
			app.miscSportIdentErrorBar.show({
				html: 'Error getting force 4800: ' + error,
			});
		}
	);
};


app.ui.getForce4800 = function() {
	return $('#force-4800-bps').prop("checked") ? 1 : 0;
};

app.writeForce4800 = function(callback)
{
	var force4800 = app.ui.getForce4800();
	app.writeProperty('force4800baudrate', force4800.toString(), 
		callback,
		function(error) {
			app.miscSportIdentErrorBar.show({
				html: 'Error saving force4800: ' + error,
			});
		}
	);
};

app.ui.displayForce4800 = function(oneway)
{
	var raw = parseInt(oneway);
	app.ui.sportident.force4800 = raw;
    $('#force-4800-bps').checkboxradio();
	$('#force-4800-bps').prop("checked",raw != 0).checkboxradio("refresh");
	app.ui.updateBackgroundColor();
};


app.ui.onReadSportIdentButton = function() {
	app.readSportIdentSettings();	
};

app.ui.onApplySportIdentButton = function() {
    //console.log('onApplyRadioAdvButton');
    app.writeOneWay(function() {
		app.writeForce4800(function() {
			app.miscSportIdentSuccessBar.show({
				html: 'SportIdent saved'
			});
			app.readSportIdentSettings();
		});
	});
};

app.readSportIdentSettings = function() {
	app.getOneWay();
	app.getForce4800();
};

//-- Battery

app.getBatteryLevel = function(callback)
{
	app.writeCommand('batterylevel', null, 
		callback,
		function(error) {
			app.batteryErrorBar.show({
				html: 'Error getting battery level'
			});
		}
	);
};


app.ui.displayBatteryLevel = function(batteryLevel)
{
	var rawBatteryLevel = parseInt(batteryLevel);
	
	var levelBar = $('.level');
	levelBar.removeClass('high');
	levelBar.removeClass('med');
	levelBar.removeClass('low');
	if (rawBatteryLevel > 60) {
	  levelBar.addClass('high');
	} else if (rawBatteryLevel >= 30 ) {
	  levelBar.addClass('med');
	} else {
	  levelBar.addClass('low');
	}
	if (rawBatteryLevel > 100) {
		levelBar.css('width', '100%');
	} else {
		levelBar.css('width', rawBatteryLevel + '%');
	}
};


app.getIsCharging = function(callback)
{
	app.writeProperty('ischarging', null, 
		callback,
		function(error) {
			app.batteryErrorBar.show({
				html: 'Error getting if charging'
			});
		}
	);
};


app.ui.displayIsCharging = function(isCharging)
{
	var rawIsCharging = parseInt(isCharging);

	var levelBar = $('.level');
	if (rawIsCharging > 0) {
		levelBar.addClass('charging');
	} else {
		levelBar.removeClass('charging');
	}
};


//-- Send to Sirap enabled
app.getSendToSirapEnabled = function(callback)
{
	app.writeProperty('sendtosirapenabled', null, 
		callback,
		function(error) {
			app.sirapErrorBar.show({
				html: 'Error getting Sirap settings (Enabled): ' + error
			});
		}
	);
};

app.ui.getSendToSirapEnabled = function() {
	return $('#sendtosirapenabled').prop("checked") ? 1 : 0;
};


app.writeSendToSirapEnabled = function(callback)
{
	var sirapEnabled = app.ui.getSendToSirapEnabled();
	app.writeProperty('sendtosirapenabled', sirapEnabled.toString(), 
		callback,
		function(error) {
			app.sirapErrorBar.show({
				html: 'Error saving Sirap settings (Enabled): ' + error
			});
		}
	);
};

app.ui.displaySendToSirapEnabled = function(sirapEnabled)
{
	var raw = parseInt(sirapEnabled);
	app.ui.sirap.sendToSirapEnabled = raw;
	$('#sendtosirapenabled').prop("checked",raw != 0).checkboxradio("refresh");
	app.ui.updateBackgroundColor();
};


app.isNumber = function(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

app.validateIPaddress = function(ipaddress)   
{  
	var ipformat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;  
	if(ipaddress.match(ipformat))  
	{  
		return true;  
	}
	return false;
};

//-- Send to Sirap ip
app.getSendToSirapIP = function(callback)
{
	app.writeProperty('sendtosirapip', null, 
		callback,
		function(error) {
			app.sirapErrorBar.show({
				html: 'Error getting Sirap settings (IP): ' + error
			});
		}
	);
};

app.ui.getSendToSirapIP = function() {
	var sirapIP = $("#sendtosirapip").val();
	return sirapIP;
};

app.writeSendToSirapIP = function(callback)
{
	var sirapIP = app.ui.getSendToSirapIP();
	if (!app.validateIPaddress(sirapIP)) {
		app.sirapErrorBar.show({
			html: 'Sirap IP Address incorrect format'
		});
	} else {
		app.writeProperty('sendtosirapip', sirapIP, 
			callback,
			function(error) {
				app.sirapErrorBar.show({
					html: 'Error saving Sirap settings (IP): ' + error
				});
			}
		);
	}
};

app.ui.displaySendToSirapIP = function(sirapIPString)
{
	app.ui.sirap.sendToSirapIP = sirapIPString;
	$("#sendtosirapip").val(sirapIPString);
	app.ui.updateBackgroundColor();
};

//-- Send to Sirap ip port
app.getSendToSirapIPPort = function(callback)
{
	//console.log('getSendToSirapIPPort');
	app.writeProperty('sendtosirapipport', null, 
		callback,
		function(error) {
			app.sirapErrorBar.show({
				html: 'Error getting Sirap settings (Port): ' + error
			});
		}
	);
};



app.ui.getSendToSirapIPPort = function() {
	var sirapIPPort = $("#sendtosirapipport").val();
	var sirapIPPortInteger = parseInt(sirapIPPort);
	if (app.isNumber(sirapIPPortInteger)) {
		return sirapIPPort;
	}
	return '';
};

app.writeSendToSirapIPPort = function(callback, errorCallback)
{
	var sirapIPPort = app.ui.getSendToSirapIPPort();
 	if (sirapIPPort == '') {
		app.sirapErrorBar.show({
			html: 'Sirap Port must be an integer'
		});
		errorCallback();
	} else {
		app.writeProperty('sendtosirapipport', sirapIPPort, 
			callback,
			function(error) {
				app.sirapErrorBar.show({
					html: 'Error saving Sirap settings (Port): ' + error
				});
			}
		);
	}
};

app.ui.displaySendToSirapIPPort = function(sirapIPPort)
{
	var rawSirapIPPort = parseInt(sirapIPPort);
	app.ui.sirap.sendToSirapIPPort = sirapIPPort;
	$("#sendtosirapipport").val(rawSirapIPPort);
	app.ui.updateBackgroundColor();
};

// get all
app.getAll = function(callback)
{
	app.writeCommand('getall', null, 
		callback, 
		function(error) {
			console.log('getAll error: ' + error);
			app.radioErrorBar.show({
				html: 'Error getting all'
			});
		}
	);
};

//-- Get Wifi networks
app.getNetworkWifiList = function(callback)
{
	app.writeCommand('listwifi', null, 
		callback, 
		function(error) {
			app.networkErrorBar.show({
			    html: 'Error getting wifi list: ' + error
			});
		}
	);
};

app.ui.displayNetworkWifiList = function(wifiListString)
{
	//console.log('wifi list: ' + rawWifiList);
	var rowList = wifiListString.split(/\r?\n/);
	var table = $('<table style="border:0px;padding:0px;width:100%;table-layout:fixed"></table>');
	$('#wifi-networks').html(table);
	for (var i = 0; i < rowList.length; i += 3) {
		var networkName = rowList[i];
		networkName = $('<div/>').text(networkName).html();
		var isConnected = (rowList[i+1] == 'yes');
		var signalStrength = rowList[i+2];
		var buttonText = "CONNECT";
		if (isConnected) {
			buttonText = "DISCONNECT";
		}
		// Create tag for device data.
		var element = $('<tr>'
			+       '<td style="white-space:nowrap;overflow:hidden;width:50%;">' +networkName +'</td>'
			+       '<td style="width:15%;text-align:center">' + signalStrength + '</td>'
			+       '<td><a href="#" class="ui-btn wifi-connect-button">' + buttonText + '</a></td>'
			+     '</tr>'
		);
		
		element.find('a.wifi-connect-button').bind("click",
			{name: networkName, isConnected: isConnected},
			app.ui.onWifiConnectButton);
		table.append(element);
	}
};

//-- Wifi connect/ disconnect
app.ui.onWifiConnectButton = function(event) {
	var networkName = event.data.name;
	var isConnected = event.data.isConnected;
	if (isConnected) {
		app.writeDisconnectWifi(networkName, function() {
			app.networkInfoBar.settings.autohide = true;
			app.networkInfoBar.settings.onHide = function() {
			        app.getNetworkWifiList();
    			};
			app.networkInfoBar.show({
				html: 'Disconnecting Wifi'
			});
		});
	} else {
		$('#popupWifiLogin').data('networkName', networkName);
		$('#popupWifiLogin').popup('open');
	}
};

app.ui.onWifiPasswordConnectButton = function(event) {
	$('#popupWifiLogin').popup('close');
	app.networkInfoBar.settings.autohide = false;
	app.networkInfoBar.settings.onHide = function() {
	        app.getNetworkWifiList();
	};
	app.networkInfoBar.show({
		html: 'Connecting Wifi'
	});
	var networkName = $('#popupWifiLogin').data('networkName');
	var password = $('#wifiPassword').val();
	app.writeConnectWifi(networkName, password, function() {
		setTimeout(function () { app.networkInfoBar.hide();}, 6000);			
	});
};

//-- Wifi connect

app.writeConnectWifi = function(networkName, password, callback)
{
	app.writeCommand('connectwifi', networkName + '\n' + password, 
		callback, 
		function(error) {
			app.networkErrorBar.show({
			    html: 'Error connecting to wifi: ' + error
			});
			app.networkInfoBar.hide();
		}
	);
};

//-- Wifi disconnect
app.writeDisconnectWifi = function(networkName, callback)
{
	app.writeCommand('disconnectwifi', null, 
		callback, 
		function(error) {
			app.networkErrorBar.show({
			    html: 'Error disconnecting wifi: ' + error
			});
		}
	);
};

//-- get IP
app.getIPAddress = function(callback)
{
	app.writeCommand('getip', null, 
		callback, 
		function(error) {
			console.log('getipaddress error');
			app.networkErrorBar.show({
				html: 'Error getting ip address: ' + error,
			});
		}
	);
};

app.ui.displayIPAddress = function(IPAddressString)
{
	$("#ipaddress").text(IPAddressString);
};


//-- Renew IP
app.ui.onRenewIPWifi = function(event)
{
	app.writeCommand('renewip', 'wifi', 
		callback, 
		function(error) {
			console.log('Renewing IP failed: ' + error);
			app.networkErrorBar.show({
			    html: 'Renewing IP failed'
			});
		}
	)
};

app.ui.onRenewIPEthernet = function(event)
{
	app.writeCommand('renewip', 'ethernet', 
		callback, 
		function(error) {
			console.log('Renewing IP failed: ' + error);
			app.networkErrorBar.show({
			    html: 'Renewing IP failed'
			});
		}
	)
};

app.ui.displayAll = function(allString) {
	console.log(allString);
	var all = allString.split('¤');
	//     0             1                2               3            4                       5                 6        7        8         9       10    11   12            13               14             15         16
	// isCharging¤wirocDeviceName¤sentToSirapIPPort¤sendToSirapIP¤sentToSirapEnabled¤acknowledgementRequested¤dataRate¤channel¤intPercent¤ipAddress¤power¤chip¤range¤wirocPythonVersion¤wirocBLEVersion¤wirocHWVersion¤SIOneWay
	if (all.length > 11) {
		app.ui.displayChip(all[11]);
		app.ui.displayRange(all[12]);
	}
	app.ui.displayIsCharging(all[0]);
	app.ui.displayWiRocDeviceName(all[1]);
	app.ui.displaySendToSirapIPPort(all[2]);
	app.ui.displaySendToSirapIP(all[3]);
	app.ui.displaySendToSirapEnabled(all[4]);
	app.ui.displayAcknowledgementRequested(all[5]);
	app.ui.displayChannel(all[7]);
	app.ui.displayBatteryLevel(all[8]);
	app.ui.displayIPAddress(all[9]);
	app.ui.displayPower(all[10]);
	if (all.length > 14) {
		app.ui.displayUpdateWiRocPython('v' + all[13]);
		app.ui.displayUpdateWiRocBLE('v' + all[14]);
	}
	if (all.length > 16) {
		app.ui.displayWarningNotes(all[11], all[5], all[10], all[16]);
	}
};

app.readAndDisplayAll = function(callback) {
	app.getAll(function() { 
		callback();
	});
};

app.readBasicSettings = function() {
	app.getBatteryLevel();
	app.getIsCharging();
	app.getRange();
	app.getChannel();
	app.getAcknowledgementRequested();
	app.getIPAddress();
};

app.ui.onReadBasicButton = function() {
	app.readBasicSettings();
};

app.ui.onApplyBasicButton = function() {
	app.writeChannel(function() {
        var displayRadioSettings = function() {
			app.radioSuccessBar.show({
		    		html: 'Radio settings saved'
			});

			app.getRange();
			app.getChannel();
			app.getAcknowledgementRequested();
		};
		
		app.writeRange(displayRadioSettings);
	});
};


app.ui.onReadRadioAdvButton = function() {
	app.readRadioAdvSettings();	
};

app.ui.onApplyRadioAdvButton = function() {
    app.writeAcknowledgementRequested(function() {
		app.writePower(function() {
			app.miscRadioAdvSuccessBar.show({
				html: 'Radio adv saved'
			});
			app.readRadioAdvSettings();
		});
	});
};

app.readRadioAdvSettings = function() {
	app.getAcknowledgementRequested();
	app.getPower();
};

// Sirap

app.readSirapSettings = function() {
	app.getBatteryLevel();
	app.getSendToSirapEnabled();
	app.getSendToSirapIP();
	app.getSendToSirapIPPort();
};

app.ui.onReadSirapButton = function() {
	app.readSirapSettings();
};

app.ui.onApplySirapButton = function() {
	app.writeSendToSirapEnabled(function() {
		app.writeSendToSirapIP(function() {
			app.writeSendToSirapIPPort(function() {
				app.sirapSuccessBar.show({
			    		html: 'Sirap settings saved'
				});
				app.getSendToSirapEnabled();
				app.getSendToSirapIP();
				app.getSendToSirapIPPort();
			}, function() {
				app.getSendToSirapEnabled();
				app.getSendToSirapIP();
				app.getSendToSirapIPPort();
			});
		});
	});
};



app.ui.onGetNetworkWifiListButton = function() {
	app.getNetworkWifiList();
};

app.getDeviceFromBackend = function(btAddress, callback) {
	var url = "http://wirelessradioonlinecontrol.tk/api/v1/Devices/LookupDeviceByBTAddress/" + encodeURI(btAddress);
	console.log(url);
	if (window.cordova) {
		// do something cordova style
		//console.log('getDeviceFromBackend: ' + btAddress);
		cordovaHTTP.get(
		   url,
		   {},
		   { Authorization: app.backendApiKey },
		   function (response) {
			  if (response) {
				 console.log('getDeviceFromBackend response: ' + response.data);
				 callback(JSON.parse(response.data));
			  }
		   },
		   function (error) {
			  console.log(JSON.stringify(error));
		   }
		);
	}
	else {
		// fallback to web methods
		return fetch(url,
		{
			credentials: 'same-origin',
			headers: {
			  'Accept': 'application/json',
			  'Authorization': app.backendApiKey
			},
			method: "GET"
		})
		.then(function(res) { 
			return res.json();
		})
		.catch(function(res){ console.log(res); });
	}
};

app.saveDeviceToBackend = function(backendJsonDevice) {
	if (window.cordova) {
		// do something cordova style
		console.log('saveDeviceToBackend');
		cordovaHTTP.get(
		   "http://wirelessradioonlinecontrol.tk/api/v1/Devices/" + backendJsonDevice.id + "/UpdateDeviceName/" + backendJsonDevice.name, 
		   backendJsonDevice,
		   { Authorization: app.backendApiKey },
		   function (response) {
			   console.log(response.data);
		   },
		   function (error) {
			  console.log(JSON.stringify(error));
		   }
		);
	}
	else {
		return fetch("http://wirelessradioonlinecontrol.tk/api/v1/Devices/" + backendJsonDevice.id,
		{
			credentials: 'same-origin',
			headers: {
			  'Accept': 'application/json',
			  'Authorization': app.backendApiKey
			},
			method: "PUT",
			body: JSON.stringify( backendJsonDevice )
		})
		.catch(function(res){ console.log('fetch device: ' + res); });
	}
};


// Device name
app.ui.onApplyDeviceNameButton = function()
{
	var devName = app.ui.getWiRocDeviceName();
	console.log("Device name entered: " + devName);
	
	app.writeWiRocDeviceName(function() {
		app.miscDeviceNameSuccessBar.show({
			html: 'Device name saved'
		});
		// save to backend
		app.getDeviceFromBackend(app.connectedDevice.address, function(backendJsonDevice) {
			if (backendJsonDevice) {
				backendJsonDevice.name = devName;
				app.saveDeviceToBackend(backendJsonDevice);
			}
		});
		app.getWiRocDeviceName();
	});
};

app.getWiRocDeviceName = function(callback) {
	console.log('getWiRocDeviceName');
	
	app.writeProperty('wirocdevicename', null, 
		callback,
		function(error) {
			app.miscDeviceNameErrorBar.show({
				html: 'Error getting device name: ' + error
			});
		}
	);
};

app.ui.displayWiRocDeviceName = function(deviceName) {
	app.ui.misc.deviceName = deviceName;
	$('#wirocdevicename').val(deviceName);
	$('#device-name').text(deviceName);
	$('#device-name2').text(deviceName);
	app.ui.updateBackgroundColor();
};

app.ui.getWiRocDeviceName = function()
{
	var devName = $('#wirocdevicename').val();
	return devName;
};

app.writeWiRocDeviceName = function(callback)
{
	var deviceName = app.ui.getWiRocDeviceName();
	if (!app.validateDeviceName(deviceName)) {
		app.miscDeviceNameErrorBar.show({
			html: 'Device name invalid'
		});
	} else {
		app.writeProperty('wirocdevicename', deviceName, 
			callback, 
			function(error) {
				app.miscDeviceNameErrorBar.show({
					html: 'Error saving device name: ' + error
				});
			}
		);
	}
};

app.validateDeviceName = function(deviceName) {
	
	if (deviceName.length > 12) {
		return false;
	}
	const regex = RegExp('^[a-zA-Z 0-9_-]*$');
	if (!regex.test(deviceName)) {
		return false;
	}
	return true;
};

app.ui.onReadDeviceNameButton = function()
{
	app.getWiRocDeviceName();
};

// Status

app.wiRocStatus = '';

app.getWiRocStatus = function(callback) {
	console.log('getStatus');
	app.writeProperty('status', null, 
		callback, 
		function(error) {
			app.miscStatusErrorBar.show({
				html: 'Error getting status 2: ' + error
			});
		}
	);
};

app.ui.displayWiRocStatus = function(status) {
	var statusObj = JSON.parse(status);
	var html = "<h2>Input:</h2><table width=\"100%\" border=1><thead>";
	html += "<tr><th align=\"left\">Type</th><th align=\"left\">Instance</th></tr></thead><tbody>";
	for (var i = 0; i < statusObj.inputAdapters.length; i++) {
		var inputAdapter = statusObj.inputAdapters[i];
		html += "<tr><td>" + inputAdapter.TypeName + "</td><td>" + inputAdapter.InstanceName + "</td></tr>";
	}
	html += "</tbody></table>";

	html += "<h2>Output:</h2><table width=\"100%\" border=1><thead>";
	html += "<tr><th align=\"left\">Type</th><th align=\"left\">Instance</th><th align=\"left\">Msg In</th><th align=\"left\">Msg Out</th><th align=\"left\">Enabled</th></tr></thead><tbody>";
	for (i = 0; i < statusObj.subscriberAdapters.length ; i++) {
		var subscriber = statusObj.subscriberAdapters[i];
		html += "<tr><td>" + subscriber.TypeName + "</td><td>" + subscriber.InstanceName + "</td><td>" + subscriber.MessageInName + "</td><td>" + subscriber.MessageOutName + "</td><td>" + subscriber.Enabled + "</td></tr>";
	}
	html += "</tbody></table>";
	$('#wiroc-status-content').html(html);
};

app.ui.onRefreshStatusButton = function() {
	$('#wiroc-status-content').html('');
	app.getWiRocStatus();
};

// Services
app.getServices = function(callback) {
	console.log('getServices');
	app.writeCommand('getservices', null, 
		callback, 
		function(error) {
			console.log('getServices error');
			app.miscServicesErrorBar.show({
				html: 'Error getting services: ' + error
			});
		}
	);
};


app.ui.displayServices = function(services) {
	var servicesObj = JSON.parse(services);
	var html = "<table width=\"100%\" border=1><thead>";
	html += "<tr><th align=\"left\">Name</th><th align=\"left\">Status</th></tr></thead><tbody>";
	for (var i = 0; i < servicesObj.services.length; i++) {
		var service = servicesObj.services[i];
		html += "<tr><td>" + service.Name + "</td><td>" + service.Status + "</td></tr>";
	}
	html += "</tbody></table>";

	$('#wiroc-services-content').html(html);
};

app.ui.onRefreshServicesButton = function() {
	$('#wiroc-services-content').html('');
	app.getServices();
};


// Settings
app.getWiRocSettings = function(callback)
{
	app.writeProperty('settings', null, 
		callback,
		function(error) {
			app.miscSettingsErrorBar.show({
				html: 'Error getting settings: ' + error
			});
		}
	);
};	

app.writeWiRocSetting = function(key, value, callback, errorCallback)
{
	var errorCB = errorCallback;
	if (errorCallback == null) {
		errorCB = function(error) {
			app.miscSettingsErrorBar.show({
				html: 'Error saving setting: ' + error,
			});
		};
	}
	
	var settingKeyAndValue = key+';'+value;
	app.writeProperty('setting', settingKeyAndValue, 
		callback,
		errorCB
	);
};

app.ui.displayWiRocSettings = function(settings) {
	var settingsObj = JSON.parse(settings);
	var table = $("<table width=\"100%\" border=1><thead><tr><th align=\"left\">Key</th><th align=\"left\">Value</th><th></td></tr></thead><tbody></tbody></table>");
	for (var i = 0; i < settingsObj.settings.length; i++) {
		var setting = settingsObj.settings[i];
		var element = $('<tr><td>' + setting.Key + '</td><td>' + setting.Value + '</td><td><a href="javascript:void(0)" class="edit-setting">Edit</a></td></tr>');
		
		element.find('a.edit-setting').bind("click",
			{Key: setting.Key, Value: setting.Value},
			app.ui.onEditSetting);
		table.append(element);
	}
	$('#wiroc-settings-content').append(table);
	app.ui.updateBackgroundColor();
	
	//if (app.wirocSettings == null) {
		//app.wirocSettings = settings;
	//} else {
		//app.wirocSettings = app.appendBuffer(app.wirocSettings, settings);
	//}
	//if (settings.byteLength < 20) {
		// we received all data
		//var service = evothings.ble.getService(app.connectedDevice, app.deviceStatusService);
		//var characteristic = evothings.ble.getCharacteristic(service, app.deviceStatusSettingsCharacteristic);
		//evothings.ble.disableNotification(
			//app.connectedDevice,
			//characteristic,
			//function(data) {
				//console.log('unsubscribe settings');
			//},
			//function(error) {
				//console.log('unsubscribe settings error');
				//app.miscSettingsErrorBar.show({
					//html: 'Error unsubscribeSettings: ' + error
				//});
			//}
		//);
		
		//var rawSettings =  evothings.ble.fromUtf8(app.wirocSettings);
		//app.wirocSettings = null; // reset buffer
		//console.log('displayWiRocSettings: ' + rawSettings);
		//var settingsObj = JSON.parse(rawSettings);
		//var table = $("<table width=\"100%\" border=1><thead><tr><th align=\"left\">Key</th><th align=\"left\">Value</th><th></td></tr></thead><tbody></tbody></table>");
		//for (var i = 0; i < settingsObj.settings.length; i++) {
			//var setting = settingsObj.settings[i];
			//var element = $('<tr><td>' + setting.Key + '</td><td>' + setting.Value + '</td><td><a href="javascript:void(0)" class="edit-setting">Edit</a></td></tr>');
			
			//element.find('a.edit-setting').bind("click",
				//{Key: setting.Key, Value: setting.Value},
				//app.ui.onEditSetting);
			//table.append(element);
		//}
		//$('#wiroc-settings-content').append(table);
		//app.ui.updateBackgroundColor();
	//}
};

app.ui.onRefreshSettingsButton = function() {
	$('#wiroc-settings-content').html('');
	app.getWiRocSettings(function() {});
};

app.ui.onAddSetting = function(event)
{
	$('#settingKey').val('');
	$('#settingValue').val('');
	$('#popupAddEditSetting').data('Key', '');
	$('#popupAddEditSetting').data('Value', '');
	$('#popupAddEditSetting').popup('open');
};

app.ui.onEditSetting = function(event)
{
	var key = event.data.Key;
	var value = event.data.Value;
	$('#settingKey').val(key);
	$('#settingValue').val(value);
	$('#popupAddEditSetting').data('Key', key);
	$('#popupAddEditSetting').data('Value', value);
	$('#popupAddEditSetting').popup('open');
};

app.ui.onEditSettingSaveButton = function(event) {
	$('#popupAddEditSetting').popup('close');
	var key = $('#settingKey').val();
	var value = $('#settingValue').val();
	app.writeWiRocSetting(key, value, function() {
		app.miscSettingsSuccessBar.show({
			html: 'Setting saved'
		});
		$('#wiroc-settings-content').html('');
	}, null);
};

app.appendBuffer = function(buffer1, buffer2) {
  var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
};


app.ui.displayPunches = function(punches) {
	console.log('displayPunches');
	if (app.punches == null) {
		app.punches = punches;
	} else {
		app.punches = app.appendBuffer(app.punches, punches);
	}
	if (punches.byteLength < 20) {
		// we received all data
		var rawPunches =  evothings.ble.fromUtf8(app.punches);
		app.punches = null; // reset buffer
		console.log('displayPunches: ' + rawPunches);
		var punchesObj = JSON.parse(rawPunches);
		var table = $("#wiroc-punches-table tbody");
		for (var i = 0; i < punchesObj.punches.length; i++) {
			var punch = punchesObj.punches[i];
			var element = $('<tr><td>' + punch.StationNumber + '</td><td>' + punch.SICardNumber + '</td><td>' + punch.Time + '</td></tr>');
			table.append(element);
		}
	}
};

app.subscribePunches = function() {
	console.log("subscribePunches / unsubscribe: '" + $('#btnSubscribePunches').data('subscribe') + "'");
	var service = evothings.ble.getService(app.connectedDevice, app.apiService);
	var characteristic = evothings.ble.getCharacteristic(service, app.punchesCharacteristic);

	if ($('#btnSubscribePunches').data('subscribe'))
	{
		evothings.ble.enableNotification(
			app.connectedDevice,
			characteristic,
			function(data) {
				console.log('subscribePunches data');
				app.ui.displayPunches(data);
			},
			function(error) {
				console.log('subscribePunches error');
				app.miscPunchesErrorBar.show({
					html: 'Error subscribePunches: ' + error
				});
			}
		);
		$('#btnSubscribePunches').text("Unsubscribe");
		$('#btnSubscribePunches').data("subscribe", false);
	} else {
		app.punches = null;
		evothings.ble.disableNotification(
			app.connectedDevice,
			characteristic,
			function(data) {
				console.log('unsubscribe punches');
				$('#btnSubscribePunches').text("Subscribe");
				$('#btnSubscribePunches').data("subscribe", true);
			},
			function(error) {
				console.log('unsubscribePunches error');
				app.miscPunchesErrorBar.show({
					html: 'Error unsubscribePunches: ' + error
				});
			}
		);
	}
};

app.ui.onSubscribePunchesButton = function() {
	app.subscribePunches();
};

// Delete Punches
app.deletePunches = function(callback) {
	console.log('Delete punches');
	app.writeCommand('database', 'deletepunches', 
		callback, 
		function(error) {
			app.miscDatabaseErrorBar.show({
			    html: 'Error when deleting punches: ' + error
			});
			app.miscDatabaseErrorBar.hide();
		}
	);
};

app.ui.onDeletePunchesButton = function() {
	app.deletePunches();
};

// Drop tables
app.dropAllTables = function(callback) {
	console.log('Drop all tables');
	app.writeCommand('dropalltables', null, 
		callback, 
		function(error) {
			app.miscDatabaseAdvErrorBar.show({
			    html: 'Error when dropping tables: ' + error
			});
			app.miscDatabaseAdvErrorBar.hide();
		}
	);
};

app.ui.onDropAllTablesButton = function() {
	app.dropAllTables();
};


// Upload database and logs
app.uploadDatabaseAndLogs = function(callback) {
	console.log('Upload database and logs');
	app.writeCommand('uploadlogarchive', null, 
		callback, 
		function(error) {
			app.miscDatabaseAdvErrorBar.show({
			    html: 'Error when uploading: ' + error
			});
			app.miscDatabaseAdvErrorBar.hide();
		}
	);
};

app.ui.onUploadDatabaseAndLogsButton = function() {
	app.uploadDatabaseAndLogs();
};



app.ui.displayTestPunches = function(testPunches) {
	console.log('displayTestPunches 1: ' +  evothings.ble.fromUtf8(testPunches));
	if (app.testPunches == null) {
		app.testPunches = testPunches;
	} else {
		app.testPunches = app.appendBuffer(app.testPunches, testPunches);
	}
	if (testPunches.byteLength < 20) {
		// we received all data from this push

		var rawTestPunches =  evothings.ble.fromUtf8(app.testPunches);
		app.testPunches = null; // reset buffer
		console.log('displayTestPunches: ' + rawTestPunches);
		var punchesObj = JSON.parse(rawTestPunches);

		var ackReq = $('#acknowledgement').prop("checked");
		var table = $("#wiroc-test-punches-table tbody");
		for (var i = 0; i < punchesObj.punches.length; i++) {
			var punch = punchesObj.punches[i];
			var trs = table.find('tr[data-id="' + punch.Id + '"]');
			var noOfSendTriesColor = "";
			if (punch.NoOfSendTries == 1 && ((punch.Status == 'Acked' && ackReq) || (punch.Status == 'Not acked' && !ackReq))) {
				// Success
				noOfSendTriesColor = ' style="background-color:#2ECC71"';
			} else if (punch.NoOfSendTries > 1) {
				noOfSendTriesColor = ' style="background-color:#E74C3C"';
			}
			var statusColor = "";
			if ((punch.Status == 'Acked' && ackReq) || (punch.Status == 'Not acked' && !ackReq)) {
				// Success
				statusColor = ' style="background-color:#2ECC71"';
			} else if (punch.NoOfSendTries > 1 && (punch.Status == 'Not sent' || punch.Status == 'Not acked')) {
				statusColor = ' style="background-color:#E74C3C"';
			}
			var rowText = '<tr data-id="' + punch.Id + '" data-subscrId="' + punch.SubscrId + '"><td>' + punch.SINo + '</td><td>' + punch.Time + '</td><td>' + punch.RSSI + '</td><td' + noOfSendTriesColor +'>' + punch.NoOfSendTries + '</td><td'+ statusColor + '>' + punch.Status + '</td></tr>';
			var rowElement = $(rowText);
			if (trs.length > 0) {
				trs[0].replaceWith(rowElement[0]);
				console.log("replace");
			} else {
				table.append(rowElement);
				console.log("append");
			}
		}

		var status;
		var noOfSendTries;
		// calculate percentages
		var allTrs = table.find('tr');
		var triesPercentage = "Unknown";
		var statusPercentage = "Unknown";
		if (ackReq) {
			var sumNoOfFailedTries = 0;
			var sumNoOfSuccessTries = 0;
			var sumNoOfTries = 0;
			for (var j = 0; j < allTrs.length; j++) {
				noOfSendTries = $(allTrs[j]).find('td').eq(3).html();
				status = $(allTrs[j]).find('td').eq(4).html();
				console.log("noOfSendTries: " + noOfSendTries);
				console.log("status: " + status);
				if (status == 'Not sent' || status == 'Not acked') {
					sumNoOfTries += parseInt(noOfSendTries);
					sumNoOfFailedTries += parseInt(noOfSendTries);
				} else if (status == 'Acked') {
					sumNoOfTries += parseInt(noOfSendTries);
					sumNoOfFailedTries += parseInt(noOfSendTries) - 1;
					sumNoOfSuccessTries += 1;
				}
			}
		
			triesPercentage = 0;
			if (sumNoOfTries > 0) { triesPercentage = Math.round(sumNoOfSuccessTries*100 / sumNoOfTries); }
			statusPercentage = 0;
			if (allTrs.length > 0) { statusPercentage = Math.round(sumNoOfSuccessTries*100 / allTrs.length); }
			
		}
		var tfoot = $("#wiroc-test-punches-table tfoot");
		var summaryTrs = tfoot.find('tr[data-id="summary"]');
		var sumRowElement = $('<tr data-id="summary"><td></td><td colspan="2">Success %</td><td>' + triesPercentage + '%</td><td>' + statusPercentage + '%</td></tr>');
		if (summaryTrs.length > 0) {
			summaryTrs[0].replaceWith(sumRowElement[0]);
		}
	

		var noOfCompletedRows = 0;
		for (var k = 0; k < allTrs.length; k++) {
			noOfSendTries = $(allTrs[k]).find('td').eq(3).html();
			status = $(allTrs[k]).find('td').eq(4).html();
			console.log("noOfSendTries: " + noOfSendTries);
			console.log("status: " + status);
			if ((status == 'Acked' && ackReq) || (status =='Not acked' && !ackReq) || 
				(parseInt(noOfSendTries) > 1 && (status == 'Not sent' || status == 'Not acked'))) {
				noOfCompletedRows++;
			}
		}

		// Check if we received all
		console.log("No of rows: " + allTrs.length);
		console.log("No of punches to send: " + app.ui.misc.noOfTestPunchesToSend);
		console.log("No of completed rows: " + noOfCompletedRows);
		if (allTrs.length == app.ui.misc.noOfTestPunchesToSend &&
			app.ui.misc.noOfTestPunchesToSend == noOfCompletedRows)
		{
			console.log("we received all");
			var service = evothings.ble.getService(app.connectedDevice, app.apiService);
			var characteristic = evothings.ble.getCharacteristic(service, app.testPunchesCharacteristic);
			evothings.ble.disableNotification(
				app.connectedDevice,
				characteristic,
				function(data) {
					console.log('unsubscribe test punches');
					$('#stopTestPunch').addClass('ui-disabled');
					$('#testPunchLoading').hide();
				},
				function(error) {
					console.log('unsubscribe test punches error');
					app.miscTestPunchesErrorBar.show({
						html: 'Error unsubscribe: ' + error
					});
				}
			);
		}
	}
	console.log("displaytestPunches end");
};

app.ui.onSendTestPunchesStopButton = function(event) {
	app.testPunches = null;
	var service = evothings.ble.getService(app.connectedDevice, app.apiService);
	var characteristic = evothings.ble.getCharacteristic(service, app.testPunchesCharacteristic);
	evothings.ble.disableNotification(
		app.connectedDevice,
		characteristic,
		function(data) {
			console.log('unsubscribe test punches');
			$('#stopTestPunch').addClass('ui-disabled');
			$('#testPunchLoading').hide();
		},
		function(error) {
			console.log('unsubscribe test punches error');
			app.miscTestPunchesErrorBar.show({
				html: 'Error unsubscribe: ' + error
			});
		}
	);
};

app.ui.onSendTestPunchesButton = function(event) {
	console.log('onSendTestPunchesButton');
	app.testPunches = null;

	$("#wiroc-test-punches-table tbody").html('');
	$('#stopTestPunch').removeClass('ui-disabled');
	$('#testPunchLoading').show();


	app.ui.misc.noOfTestPunchesToSend = $("#noOfTestPunches option:selected").val();
	var siNumber = $("#siNumber").val();
	var sendInterval = $("#sendInterval").val();
	var ackReq = $('#acknowledgement').prop("checked") ? 1 : 0;
	var param = app.ui.misc.noOfTestPunchesToSend + ';' + sendInterval + ';' + siNumber + ';' + ackReq;

	var te = new TextEncoder("utf-8").encode(param);
	var parameters = new Uint8Array(te);
	var service = evothings.ble.getService(app.connectedDevice, app.apiService);
	var characteristic = evothings.ble.getCharacteristic(service, app.testPunchesCharacteristic);
	evothings.ble.writeCharacteristic(
		app.connectedDevice,
		characteristic,
		parameters,
		function() {
			console.log('Sending test punches initiated');
			app.miscTestPunchesSuccessBar.settings.autohide = true;
			app.miscTestPunchesSuccessBar.show({
			    html: 'Sending test punches initiated'
			});
			evothings.ble.enableNotification(
				app.connectedDevice,
				characteristic,
				function(data) {
					console.log('subscribe test punches, data received');
					app.ui.displayTestPunches(data);
				},
				function(error) {
					console.log('subscribe test punches error');
					app.miscTestPunchesErrorBar.show({
						html: 'Error subscribePunches: ' + error
					});
				}
			);
		},
		function(error) {
			app.miscTestPunchesErrorBar.show({
			    html: 'Error sending test punches: ' + error
			});
			app.miscTestPunchesErrorBar.hide();
		}
	);
};

// COMMAND functions
app.enableCommandNotification = function()
{
	var service = evothings.ble.getService(app.connectedDevice, app.apiService);
	var characteristic = evothings.ble.getCharacteristic(service, app.commandCharacteristic);
	evothings.ble.enableNotification(
		app.connectedDevice,
		characteristic,
		function(data) {
			if (app.commandResponse == null) {
				app.commandResponse = data;
			} else {
				app.commandResponse = app.appendBuffer(app.commandResponse, data);
			}
			if (data.byteLength < 20) {
				// we received all data
				var commandAndResponseString = new TextDecoder("utf-8").decode(app.commandResponse);
				app.commandResponse = null;
				app.ui.displayProperty(commandAndResponseString);
			}
		},
		function(error) {
			app.radioErrorBar.show({
				html: 'Error subscribe command: ' + error
			});
		}
	);
};

app.disableCommandNotification = function()
{
	var service = evothings.ble.getService(app.connectedDevice, app.apiService);
	var characteristic = evothings.ble.getCharacteristic(service, app.commandCharacteristic);
	evothings.ble.disableNotification(
		app.connectedDevice,
		characteristic,
		function(data) {
			console.log('unsubscribe command data received');
		},
		function(error) {
			console.log('unsubscribe command error');
			app.radioErrorBar.show({
				html: 'Error unsubscribe command: ' + error
			});
		}
	);
};

app.writeCommand = function(commandName, commandValue, successCallback, errorCallback)
{
	var commandNameAndValue = commandName + ';' + (commandValue == null ? '' : commandValue);
	var te = new TextEncoder("utf-8").encode(commandNameAndValue);
	var parameters = new Uint8Array(te);
	var service = evothings.ble.getService(app.connectedDevice, app.apiService);
	var characteristic = evothings.ble.getCharacteristic(service, app.commandCharacteristic);
	evothings.ble.writeCharacteristic(
		app.connectedDevice,
		characteristic,
		parameters,
		function() { 
			if (successCallback != null) {
				successCallback();
			}
		},
		errorCallback
	);
};

// PROPERTY functions
app.enablePropertyNotification = function()
{
	var service = evothings.ble.getService(app.connectedDevice, app.apiService);
	var characteristic = evothings.ble.getCharacteristic(service, app.propertyCharacteristic);
	evothings.ble.enableNotification(
		app.connectedDevice,
		characteristic,
		function(data) {
			if (app.propertyResponse == null) {
				app.propertyResponse = data;
			} else {
				app.propertyResponse = app.appendBuffer(app.propertyResponse, data);
			}
			if (data.byteLength < 20) {
				// we received all data
				var propertyResponseString = new TextDecoder("utf-8").decode(app.propertyResponse);
				app.propertyResponse = null;
				app.radioErrorBar.show({
					html: 'prp:' + propertyResponseString
				});
				app.ui.displayProperty(propertyResponseString);
			}
		},
		function(error) {
			console.log('subscribe property error');
			app.radioErrorBar.show({
				html: 'Error subscribe property: ' + error
			});
		}
	);
};

app.disablePropertyNotification = function()
{
	var service = evothings.ble.getService(app.connectedDevice, app.apiService);
	var characteristic = evothings.ble.getCharacteristic(service, app.propertyCharacteristic);
	evothings.ble.disableNotification(
		app.connectedDevice,
		characteristic,
		function(data) {
			console.log('unsubscribe property data received');
		},
		function(error) {
			console.log('unsubscribe property error');
			app.radioErrorBar.show({
				html: 'Error unsubscribe property: ' + error
			});
		}
	);
};

app.writeProperty = function(propName, propValue, successCallback, errorCallback)
{
	var propNameAndPropValue = propName + ';' + (propValue == null ? '' : propValue);
	var te = new TextEncoder("utf-8").encode(propNameAndPropValue);
	var parameters = new Uint8Array(te);
	var service = evothings.ble.getService(app.connectedDevice, app.apiService);
	var characteristic = evothings.ble.getCharacteristic(service, app.propertyCharacteristic);
	evothings.ble.writeCharacteristic(
		app.connectedDevice,
		characteristic,
		parameters,
		function() { 
			if (successCallback != null) {
				successCallback();
			}
		},
		errorCallback
	);
};

app.ui.displayProperty = function(propAndValueStrings)
{
	var propAndValuesArray = propAndValueStrings.split('|');
	for (var i = 0; i < propAndValuesArray.length; i++) {
		var propAndValue = propAndValuesArray[i];
		console.log(propAndValue);
		var idx = propAndValue.indexOf(';');
		var propName = propAndValue;
		var propValue = '';
		if (idx > 0) {
			propName = propAndValue.substring(0, idx);
			propValue = propAndValue.substring(idx+1);
		}
		switch(propName) {
			case 'wirocdevicename':
				app.ui.displayWiRocDeviceName(propValue);
				break;
			case 'channel':
				app.ui.displayChannel(propValue);
				break;
			case 'acknowledgementrequested':
				app.ui.displayAcknowledgementRequested(propValue);
				break;
			case 'power':
				app.ui.displayPower(propValue);
				break;
			case 'lorarange':
				app.ui.displayRange(propValue);
				break;
			case 'sendtosirapenabled':
				app.ui.displaySendToSirapEnabled(propValue);
				break;	
			case 'sendtosirapip':
				app.ui.displaySendToSirapIP(propValue);
				break;	
			case 'sendtosirapipport':
				app.ui.displaySendToSirapIPPort(propValue);
				break;	
			case 'force4800baudrate':
				app.ui.displayForce4800(propValue);
				break;	
			case 'status':
				$('#wiroc-status-content').html(propValue);
				app.ui.displayWiRocStatus(propValue);
				break;	
			case 'settings':
				app.ui.displayWiRocSettings(propValue);
				break;
			case 'setting':
				// reload table
				app.ui.getWiRocSettings();
				break;
			case 'ischarging':
				app.ui.displayIsCharging(propValue);
				break;
			case 'listwifi':
				app.ui.displayNetworkWifiList(propValue);
				break;
		    case 'connectwifi':
		       	// do nothing...
			    break;
			case 'disconnectwifi':
			    // do nothing...
			    break;
			case 'getip':
		       	app.ui.displayIPAddress(propValue);
			    break;
			case 'renewip':
		       	console.log('IP renewed');
				app.networkInfoBar.settings.autohide = true;
				app.networkInfoBar.show({
				    html: 'Renew IP command issued'
				});
			    break;
			case 'deletepunches':
		        console.log('Punches deleted');
			    app.miscDatabaseSuccessBar.settings.autohide = true;
			    app.miscDatabaseSuccessBar.show({
			       html: 'Punches deleted'
			    });
			    break;
			case 'dropalltables':
			    console.log('Tables dropped');
			    app.miscDatabaseAdvSuccessBar.settings.autohide = true;
			    app.miscDatabaseAdvSuccessBar.show({
			       html: 'Tables dropped'
			    });
			    break;
			case 'getall':
			    app.ui.displayAll(propValue);
			    break;
			case 'uploadlogarchive':
    			console.log('zip file uploaded');
				app.miscDatabaseAdvSuccessBar.settings.autohide = true;
				app.miscDatabaseAdvSuccessBar.show({
					html: 'Zip with database and logs uploaded'
				});
				break;
			case 'upgradewirocpython':
			    // do nothing...    
    			break;
			case 'upgradewirocpython':
				// do nothing...
				break;	
			case 'getservices':
				app.ui.displayServices(propValue);
				break;
			case 'onewayreceive':
				app.ui.displayOneWay(propValue);
				break;
			case 'batterylevel':
				app.ui.displayBatteryLevel(propValue);
				break;
			default:
				// code block
				console.log('error displayProperty, propName not found');
		}
	};
};


//////////////////////////////

app.connect = function(device)
{
    $('#wiroc-status-content').html('');
	$('#wiroc-services-content').html('');
	$('#wiroc-settings-content').html('');
	$("#wiroc-punches-table tbody").html('');
	$("#wiroc-test-punches-table tbody").html('');
	app.testPunches = null;
	app.punches = null;
	app.wirocSettings = null;
	$('#stopTestPunch').addClass('ui-disabled');
	$('#testPunchLoading').hide();
	
	// Android connect error 133 might be prevented by waiting a
	// little before connect (to make sure previous BLE operation
	// has completed).
	setTimeout(
		function()
		{
            console.log('connect('+device.address+')');
			evothings.ble.connectToDevice(
				device,
				app.onConnected,
				app.onDisconnected,
				app.onConnectError,
				{ discoverServices: false }
			);
		},
	600);      
};


// Called when device is connected.
app.onConnected = function(device)
{
	console.log('Connected to device');
	app.stopScan();
	app.devices = {};
	app.ui.displayDeviceList();

	app.connectedDevice = device;

	evothings.ble.readServiceData(
		app.connectedDevice,
		function readServicesSuccess(services)
		{
			app.searchDevicesErrorBar.show({ html: 'services read' });
			$(":mobile-pagecontainer").pagecontainer( "change", "#page-basic-config", { } );
			app.enablePropertyNotification();
			app.enableCommandNotification();
			app.readAndDisplayAll(function() {
				$('#tab-radio').css('ui-btn-active');
				$('#tab-radio').trigger('click');
			});
		},
		function error() {
			app.radioSuccessBar.show({ html: 'Read misc failed' });
		},
		{ serviceUUIDs: null }
	);
};


// Called if device disconnects.
app.onDisconnected = function(device)
{
	console.log('Disconnected from device');
	app.stopScan();
	evothings.ble.close(app.devices[app.btAddressToConnect]);
	
	app.connectedDevice = null;
	$.mobile.pageContainer.pagecontainer("change", "#page-device-scan", { });
	evothings.ble.reset(function() { console.log('reset success 1'); },function() { console.log('reset fail'); });
	app.searchDevicesErrorBar.show({
		html: 'Device disconnected'
	});
};


// Called when a connect error occurs.
app.onConnectError = function(error)
{
	app.stopScan();

    app.connectErrorCount++;
    console.log('Connect error: ' + error);
  
    
    // If we get Android connect error 133, we wait and try to connect again.
    // This can resolve connect problems on Android when error 133 is seen.
    // In a production app you may want to have a function for aborting or
    // maximising the number of connect attempts. Note that attempting reconnect
    // does not block the app however, so you can still do other tasks and
    // update the UI of the app.
    if (133 == error && app.connectErrorCount <=2)
    {
		app.searchDevicesErrorBar.show({
			html: 'Connect error: ' + error + ' | Retrying...'
		});
        console.log('Reconnecting...');
        evothings.ble.close(app.devices[app.btAddressToConnect]);
		setTimeout(
             function() 
             { 
                app.connect(app.devices[app.btAddressToConnect]); 
             },
             1000);
    } else {
		app.searchDevicesErrorBar.show({
			html: 'Connect error: ' + error + ' | Reseting BT'
		});
		app.connectErrorCount = 0;
		app.devices = {};
		app.ui.displayDeviceList();
        evothings.ble.reset(function() { console.log('reset success 2'); },function() { console.log('reset fail'); });
    }
};

app.disconnect = function()
{
	if (app.connectedDevice) {
		console.log('disconnect');
		evothings.ble.close(app.connectedDevice);
		app.connectedDevice = null;
		app.servicesDiscovered = false;
		app.searchDevicesInfoBar.show({
			html: 'Reseting BT'
		});
		setTimeout(
             function() 
             { 
                evothings.ble.reset(function() { console.log('reset success 3'); },function() { console.log('reset fail'); });
             },
        1000);
	}
};

app.initialize();


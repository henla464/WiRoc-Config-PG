
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
app.btSerialErrorBar = null;
app.btSerialSuccessBar = null;
app.btSerialInfoBar = null;
app.miscSportIdentRS232ErrorBar = null;
app.miscSportIdentRS232SuccessBar = null;

app.apiService =                               'fb880900-4ab2-40a2-a8f0-14cc1c2e5608';
app.propertyCharacteristic =                    'fb880912-4ab2-40a2-a8f0-14cc1c2e5608';
app.punchesCharacteristic =              'fb880901-4ab2-40a2-a8f0-14cc1c2e5608';  //N: subscribe to punches
app.testPunchesCharacteristic =          'fb880907-4ab2-40a2-a8f0-14cc1c2e5608';  //N,R,W: test sending punches, subscribe, periodic

app.isScanning = false;
app.backendApiKey = '67f11087-32c5-4dc5-9987-bbdecb028d36';


// UI methods.
app.ui = {};
app.ui.chip = 'RF1276T';
app.ui.radio = {};
app.ui.radio.channel = null;
app.ui.radio.range = null;
app.ui.radio.acknowledgementRequested = null;
app.ui.radio.power = null;
app.ui.radio.codeRate = null;
app.ui.radio.rxGain = null;
app.ui.sirap = {};
app.ui.sirap.sendToSirapEnabled = null;
app.ui.sirap.sendToSirapIP = null;
app.ui.sirap.sendToSirapIPPort = null;
app.ui.misc = {};
app.ui.misc.deviceName = null;
app.ui.misc.noOfTestPunchesToSend = null;
app.ui.sportident = {};
app.ui.sportident.oneway = null;
app.ui.sportident.force4800 = null;
app.ui.sportident.RS232Mode = null;
app.ui.sportident.RS232OneWay = null;
app.ui.sportident.forceRS2324800 = null;
app.ui.sportident.BTSerialOneWay = null;


app.ui.update = {};
app.ui.update.wiRocBLEVersion = null;
app.ui.update.wiRocPythonVersion = null;

// Timer that updates the device list and removes inactive
// devices in case no devices are found by scan.
app.ui.updateTimer = null;

app.chunkLength = 20;
app.punches = null;
app.testPunches = null;
app.propertyResponse = null;
app.wirocSettings = null;
app.wirocHWVersion = null;
app.btSerialListStop = false;
app.btSerialNoOfTimesRefreshed = 0;

app.initialize = function()
{
	document.addEventListener(
		'deviceready',
		function() { scriptsLoaded(app.onDeviceReady); },
		false);
};

app.onDeviceReady = function()
{
	$(":mobile-pagecontainer").pagecontainer( "change", "#page-device-scan", { } );
};


/**
 * Converts an ArrayBuffer containing UTF-8 data to a JavaScript String.
 * @param {ArrayBuffer} a
 * @returns string
 */
app.fromUtf8 = function(a)
{
	return decodeURIComponent(escape(String.fromCharCode.apply(null, new Uint8Array(a))));
};

/**
 * Converts a JavaScript String to an Uint8Array containing UTF-8 data.
 * @param {string} s
 * @returns Uint8Array
 */
app.toUtf8 = function(s)
{
	var strUtf8 = unescape(encodeURIComponent(s));
	var ab = new Uint8Array(strUtf8.length);
	for (var i = 0; i < strUtf8.length; i++)
	{
		ab[i] = strUtf8.charCodeAt(i);
	}
	return ab;
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
		ble.startScanWithOptions([app.apiService], { reportDuplicates: true, scanMode: 'lowLatency' }, app.ui.deviceFound, app.ui.scanError);

		app.ui.updateTimer = setInterval(app.ui.displayDeviceList, 500);
	} else {
		app.stopScan();
	}
};

app.stopScan = function() {
	app.isScanning = false;
	$('.scan-button').html('Start scan');
	clearInterval(app.ui.updateTimer);
	ble.stopScan();
	app.ui.displayStatus('Scan stopped');
};



// Called when a device is found.
app.ui.deviceFound = function(device) //, errorCode)
{
	// Set timestamp for device (this is used to remove inactive devices).
	device.timeStamp = Date.now();
	// Insert the device into table of found devices.
	app.devices[device.id] = device;
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
	if (app.ui.radio.acknowledgementRequested != app.ui.getAcknowledgementRequested() || 
		app.ui.radio.power != app.ui.getPower()	|| 
		app.ui.radio.rxGain != app.ui.getRxGain() ||
		app.ui.radio.codeRate != app.ui.getCodeRate())
	{
		$('#radio-adv').css('background-color','#FFEFD5');
	} else {
		$('#radio-adv').css('background-color','white');
	}
	// sportident USB
	if (app.ui.sportident.oneway != app.ui.getOneWay() || app.ui.sportident.force4800 != app.ui.getForce4800())
	{
		$('#sportident').css('background-color','#FFEFD5');
	} else {
		$('#sportident').css('background-color','white');
	}
	// sportident RS232
	if (app.ui.sportident.RS232Mode != app.ui.getRS232Mode() || 
		app.ui.sportident.RS232OneWay != app.ui.getRS232OneWay() ||
		app.ui.sportident.forceRS2324800 != app.ui.getForceRS2324800())
	{
		$('#sportident-RS232').css('background-color','#FFEFD5');
	} else {
		$('#sportident-RS232').css('background-color','white');
	}
	// sportident BTSerial
	if (app.ui.sportident.BTSerialOneWay != app.ui.getBTSerialOneWay())
	{
		$('#sportident-btserial').css('background-color','#FFEFD5');
	} else {
		$('#sportident-btserial').css('background-color','white');
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
		if (timeNow < device.timeStamp + 10000)
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
				'<li style="padding:10px" class="device">' +
				   '<span class="device-header">' + device.name + '</span>' +
				   '<a href="#" style="float:right" class="ui-btn connect-button">CONNECT</a>' +
				   '<table style="border:0px;padding:0px;width:100%;">' +
				     '<tr>' +
				       '<td style="white-space:nowrap;">Bluetooth addr:</td>' +
				       '<td>' + device.id + '</td>' +
				     '</tr>' +
				     '<tr>' +
				       '<td style="white-space:nowrap;">Signal ' + device.rssi + ' dBm</td>' +
				       '<td style="background:rgb(150,150,150);margin:0px;padding:4px">' +
				          '<div style="background:#3388cc;height:20px;width:'+rssiWidth+'%;"></div>' +
				       '</td>' +
				     '</tr>' +
				   '</table>' +
				 '</li>'
			);
			
			element.find('a.connect-button').bind("click",
				{address: device.id, name: device.name},
				app.ui.onConnectButton);

			$('#found-devices').append(element);
		}
	});
};

// Display a status message
app.ui.displayDebug = function(message)
{
	$('#wiroc-debug-content').html($('#wiroc-debug-content').html() + ' ' + message);
};


app.ui.displayStatus = function(message)
{
	$('#scan-status').html(message);
};

app.ui.onConnectButton = function(event) {
	app.stopScan(); // should this be here?
	app.connectErrorCount = 0;
	//app.ui.displayStatus('onConnectButton ' + event.data.address);
	app.btAddressToConnect = event.data.address;
	//app.ui.displayStatus('onConnectButton2' + event.data.address);
	var theDevice = app.devices[event.data.address];
	app.ui.displayStatus('onConnectButton3' + theDevice.name);
	app.connect(theDevice);
	//app.ui.displayStatus('onConnectButton4' + event.data.address);
	
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
	app.ui.radio.channel = channel;

	// Select the relevant option, de-select any others
	$('#channel-select-' + app.ui.chip).val(channel).attr('selected', true).siblings('option').removeAttr('selected');

	// jQM refresh
	$('#channel-select-' + app.ui.chip).selectmenu("refresh", true);
	app.ui.updateBackgroundColor();
};

app.getChannel = function(callback)
{
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
			app.radioErrorBar.show({
				html: 'Error saving radio setting (Channel): ' + error
			});
		}
	);
};


// Lora mode
app.ui.displayLoraMode = function(loramode)
{
	app.ui.radio.loramode = loramode;
	$('#loramode').text(loramode);
	$('#loramode2').text(loramode);

	// Select the relevant option, de-select any others
	$('#loramode-select-' + app.ui.chip).val(loramode).attr('selected', true).siblings('option').removeAttr('selected');

	// jQM refresh
	$('#loramode-select-' + app.ui.chip).selectmenu("refresh", true);
	app.ui.updateBackgroundColor();
};

app.getLoraMode = function(callback)
{
	app.writeProperty('loramode', null, 
		callback,
		function(error) {
			app.radioErrorBar.show({
				html: 'Error getting radio setting (Radio Mode): ' + error
			});
		}
	);
};

app.ui.getLoraMode = function() {
	var value = $("#loramode-select-" + app.ui.chip + " option:selected").val();
	return value;
};

app.writeLoraMode = function(callback)
{
	app.writeProperty('loramode', app.ui.getLoraMode(), 
		callback,
		function(error) {
			app.radioErrorBar.show({
				html: 'Error saving radio setting (Radio Mode): ' + error
			});
		}
	);
};


//
app.ui.displayWarningNotes = function(chip, ackReq, power, siOneWay, rxGain, codeRate, rs232OneWay, btSerialOneWay)
{
	//app.radioErrorBar.show({ html: (chip==null?'null':chip) +':'+(ackReq==null?'null':ackReq) +':'+(power==null?'null':power)+':'+(siOneWay==null?'null':siOneWay) });
	if (ackReq !== null) {
		if (ackReq == '1') {
			$('#warning-note-req-ack').hide();
		} else {
			$('#warning-note-req-ack').show();
		}
	}
	if (power !== null && chip !== null) {
		if ((chip == 'RF1276T' && power == 7) ||
			(chip != 'RF1276T' && power == 22)) {
			$('#warning-note-radio-power').hide();
		} else {
			$('#warning-note-radio-power').show();
		}
	}
	if (siOneWay !== null) {
		if (siOneWay == '1') {
			$('#warning-note-si-one-way').show();
		} else {
			$('#warning-note-si-one-way').hide();
		}
	}
	if (rxGain !== null) {
		if (rxGain == '1') {
			$('#warning-note-rx-gain').hide();
		} else {
			$('#warning-note-rx-gain').show();
		}
	}
	if (codeRate !== null) {
		if (codeRate === 0) {
			$('#warning-note-code-rate').hide();
		} else {
			$('#warning-note-code-rate').show();
		}
	}
	if (rs232OneWay !== null) {
		if (rs232OneWay == '1') {
			$('#warning-note-rs232-si-one-way').show();
		} else {
			$('#warning-note-rs232-si-one-way').hide();
		}
	}
	if (btSerialOneWay !== null) {
		if (btSerialOneWay == '1') {
			$('#warning-note-btserial-si-one-way').show();
		} else {
			$('#warning-note-btserial-si-one-way').hide();
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
	$('#acknowledgement').prop("checked",raw !== 0).checkboxradio("refresh");
	app.ui.displayWarningNotes(app.ui.chip, acknowledgement, null, null, null, null, null, null);
	app.ui.updateBackgroundColor();
};

//---- rxGain enabled

app.getRxGain = function(callback)
{
	app.writeProperty('rxgainenabled', null, 
		callback,
		function(error) {
			app.miscRadioAdvErrorBar.show({
				html: 'Error getting radio settings (RxGain): ' + error,
			});
		}
	);
};


app.ui.getRxGain = function() {
	return $('#rxgain').prop("checked") ? 1 : 0;
};

app.writeRxGain = function(callback)
{
	var en = app.ui.getRxGain();
	app.writeProperty('rxgainenabled', en.toString(), 
		callback,
		function(error) {
			app.miscRadioAdvErrorBar.show({
				html: 'Error saving radio setting (RxGain): ' + error,
			});
		}
	);
};

app.ui.displayRxGain = function(rxGain)
{
	var raw = parseInt(rxGain);
	app.ui.radio.rxGain = raw;
    $('#rxgain').checkboxradio();
	$('#rxgain').prop("checked",raw !== 0).checkboxradio("refresh");
	app.ui.displayWarningNotes(app.ui.chip, null, null, null, rxGain, null, null, null);
	app.ui.updateBackgroundColor();
};

//-- Power

app.ui.displayPower = function(power)
{
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
		w.selectmenu({ nativeMenu: true });
	}

	$('#lorapower-select-' + app.ui.chip).selectmenu("refresh", true);
	
	app.ui.displayWarningNotes(app.ui.chip, null, raw, null, null, null, null, null);
	
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

//-- Code rate

app.ui.displayCodeRate = function(codeRate)
{
	var raw = parseInt(codeRate);
	app.ui.radio.codeRate = raw;
	
	// Select the relevant option, de-select any others
	$('#coderate-select').val(raw).attr('selected', true).siblings('option').removeAttr('selected');

	// jQM refresh
	var w = $("#coderate-select");
	if( w.data("mobile-selectmenu") === undefined) {
		// not initialized yet, lets do so
		w.selectmenu({ nativeMenu: true });
	}

	$('#coderate-select').selectmenu("refresh", true);
	
	app.ui.displayWarningNotes(app.ui.chip, null, null, null, null, raw, null, null);
	
	app.ui.updateBackgroundColor();
};


app.getCodeRate = function(callback)
{
	app.writeProperty('coderate', null, 
		callback,
		function(error) {
			app.miscRadioAdvErrorBar.show({
				html: 'Error getting radio setting (CodeRate): ' + error
			});
		}
	);
};

app.ui.getCodeRate = function() {
	var value = $('#coderate-select option:selected').val();
	return value;
};

app.writeCodeRate = function(callback)
{
    var codeRate = app.ui.getCodeRate();
	app.writeProperty('coderate', codeRate, 
		callback,
		function(error) {
			app.miscRadioAdvErrorBar.show({
				html: 'Error saving radio setting (CodeRate): ' + error
			});
		}
	);
};

//-- Range

app.ui.displayRange = function(rangeString)
{
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
			return res.json();
		}).then(function (versionsJson) {
			var versionsArray = [];
			for (var i = 0; i < 5; i++) {
				versionsArray.push(versionsJson[i].tag_name);
			}
			return versionsArray;
		})
		.catch(function(res){ });
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
				var latest = JSON.parse(response.data);
				if (latest.tag_name) {
					callback(latest.tag_name);
					return;
				}
			}
			callback(null);
		   },
		   function (error) {
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
			return res.json();
		}).then(function (versionObj) {
			if (versionObj.tag_name) {
				return versionObj.tag_name;
			}
			return null;
		})
		.catch(function(res){ });
	}
};


app.ui.displayUpdateWiRocPython = function(wirocPythonVersion)
{
	if (wirocPythonVersion !== null) {
	    app.ui.update.wiRocPythonVersion = wirocPythonVersion;
    }
	// load content
	if (window.cordova) {
		app.getWiRocPythonLatestVersionFromGithub(function(latest) {
			app.getWiRocPythonVersionsFromGithub(function(versions) {
				var versionOptions = [];
				$.each(versions, function(index, version) {
					if (version != latest) {
						versionOptions.push('<option value="' +version+ '">'+version+' developer release</option>');
					}
				});
			
				$("#wirocpythonversions-select").remove().end();
				var selectpython = $("<select name=\"wirocpythonversions\" id=\"wirocpythonversions-select\" data-native-menu=\"true\"></select>");
				selectpython.find('option').remove().end();
				if (latest !== null) {
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
				};
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
					selectpython.selectmenu({ nativeMenu: true });
				}
				selectpython.val(app.ui.update.wiRocPythonVersion).attr('selected', true).siblings('option').removeAttr('selected');
				selectpython.selectmenu("refresh", true);
				app.ui.updateBackgroundColor();
			});
		});
	} else {
		var latestPromise = app.getWiRocPythonLatestVersionFromGithub();
		latestPromise.then(function(latest) {
			var versionsPromise = app.getWiRocPythonVersionsFromGithub();
			versionsPromise.then(function(versions) {
				var versionOptions = [];
				$.each(versions, function(index, version) {
					if (version != latest) {
						versionOptions.push('<option value="' +version+ '">'+version+' developer release</option>');
					}
				});
			
				$("#wirocpythonversions-select").remove().end();
				var selectpython = $("<select name=\"wirocpythonversions\" id=\"wirocpythonversions-select\" data-native-menu=\"true\"></select>");
				selectpython.find('option').remove().end();
				if (latest !== null) {
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
				};
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
					selectpython.selectmenu({ nativeMenu: false });
				}
				selectpython.val(app.ui.update.wiRocPythonVersion).attr('selected', true).siblings('option').removeAttr('selected');
				selectpython.selectmenu("refresh", true);
				app.ui.updateBackgroundColor();
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
	app.ui.displayDebug('writeUpdateWiRocPython');
	var version = app.ui.getUpdateWiRocPython();
	app.ui.displayDebug('writeUpdateWiRocPython version: ' + version);
    app.writeProperty('upgradewirocpython', version, 
		callback,
		function(error) {
			app.updateErrorBar.show({
				html: 'Error sending Update: ' + error
			});
		}
	);
};

//-- Update WiRoc BLE

app.ui.onUpdateWiRocBLE = function(event)
{
	app.ui.displayDebug('onUpdateWiRocBLE');
	app.writeUpdateWiRocBLE(function() {
		app.ui.displayDebug('onUpdateWiRocBLE write callback');
		app.miscUpdateInfoBar.show({
    		html: 'Sent update command'
		});
	});
};

app.getWiRocBLEVersionsFromGithub = function(callback) {
	var url = 'https://api.github.com/repos/henla464/WiRoc-BLE-API/releases';
	if (app.wirocHWVersion == '2Rev1' || app.wirocHWVersion == '2Rev2')
	{
		url = 'https://api.github.com/repos/henla464/WiRoc-BLE-Device/releases';
	}
	app.ui.displayDebug('getWiRocBLEVersionsFromGithub ' + url);
	if (window.cordova) {
		// do something cordova style
		cordovaHTTP.get(
		   url,
		   {},
		   { Accept: 'application/json',
			credentials: 'same-origin' },
		   function (response) {
			  if (response) {
				var versionsJson = JSON.parse(response.data);
				var versionsArray = [];
				var noOfVersions = versionsJson.length > 5 ? 5 : versionsJson.length;
				for (var i = 0; i < noOfVersions; i++) {
					app.ui.displayDebug('getWiRocBLEVersionsFromGithub ' + versionsJson[i].tag_name);
					versionsArray.push(versionsJson[i].tag_name);
				}
				callback(versionsArray);
				return;
			  }
			callback(null);
		   },
		   function (error) {
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
			return res.json();
		}).then(function (versionsJson) {
			var versionsArray = [];
			var noOfVersions = versionsJson.length > 5 ? 5 : versionsJson.length;
			for (var i = 0; i < noOfVersions; i++) {
				versionsArray.push(versionsJson[i].tag_name);
				app.ui.displayDebug('getWiRocBLEVersionsFromGithub ' + versionsJson[i].tag_name);
			}
			return versionsArray;
		})
		.catch(function(res){ });
	}
};

app.getWiRocBLELatestVersionFromGithub = function(callback) {
	var url = 'https://api.github.com/repos/henla464/WiRoc-BLE-API/releases/latest';
	if (app.wirocHWVersion == '2Rev1' || app.wirocHWVersion == '2Rev2')
	{
		url = 'https://api.github.com/repos/henla464/WiRoc-BLE-Device/releases/latest';
	}

	if (window.cordova) {
		// do something cordova style
		cordovaHTTP.get(
		   url,
		   {},
		   { Accept: 'application/json',
			credentials: 'same-origin' },
		   function (response) {
			  if (response) {
				var versionObj = JSON.parse(response.data);
				if (versionObj.tag_name) {
					app.ui.displayDebug('getWiRocBLELatestVersionFromGithub cordova' + versionObj.tag_name);
					callback(versionObj.tag_name);
					return;
				}
			  }
			callback(null);
		   },
		   function (error) {
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
			return res.json();
		}).then(function (versionObj) {
			if (versionObj.tag_name) {
				app.ui.displayDebug('getWiRocBLELatestVersionFromGithub ' + versionObj.tag_name);
				return versionObj.tag_name;
			}
			return null;
		})
		.catch(function(){ });
	}
};

app.ui.displayUpdateWiRocBLE = function(wirocBLEVersion)
{
	app.ui.displayDebug('displayUpdateWiRocBLE ' + wirocBLEVersion);
	if (wirocBLEVersion !== null) {
		app.ui.update.wiRocBLEVersion = wirocBLEVersion;
	}
	if (window.cordova) {
		app.ui.displayDebug('displayUpdateWiRocBLE cordova');
		app.getWiRocBLELatestVersionFromGithub(function(latest) {
			app.getWiRocBLEVersionsFromGithub(function(versions) {
				app.ui.displayDebug('displayUpdateWiRocBLE cordova 2');
				var versionOptions = [];
				$.each(versions, function(index, version) {
					if (version != latest) {
						versionOptions.push('<option value="' +version+ '">'+version+' developer release</option>');
					}
				});
						
				$("#wirocbleversions-select").remove().end();
				var selectble = $("<select name=\"wirocbleversions\" id=\"wirocbleversions-select\" data-native-menu=\"true\"></select>");
				selectble.find('option').remove().end();
				if (latest !== null) {
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
				};
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
					selectble.selectmenu({ nativeMenu: true });
				}
				
				// Select the relevant option, de-select any others
				selectble.val(app.ui.update.wiRocBLEVersion).attr('selected', true).siblings('option').removeAttr('selected');
				selectble.selectmenu("refresh", true);
				app.ui.updateBackgroundColor();
			});
		});
	} else {
		// load content
		
		var latestPromise = app.getWiRocBLELatestVersionFromGithub();
		latestPromise.then(function(latest) {
			var versionsPromise = app.getWiRocBLEVersionsFromGithub();
			versionsPromise.then(function(versions) {
				var versionOptions = [];
				$.each(versions, function(index, version) {
					if (version !== latest) {
						versionOptions.push('<option value="' +version+ '">'+version+' developer release</option>');
					}
				});
						
				$("#wirocbleversions-select").remove().end();
				var selectble = $("<select name=\"wirocbleversions\" id=\"wirocbleversions-select\" data-native-menu=\"true\"></select>");
				selectble.find('option').remove().end();
				if (latest !== null) {
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
				};
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
					selectble.selectmenu({ nativeMenu: true });
				}
				
				// Select the relevant option, de-select any others
				selectble.val(app.ui.update.wiRocBLEVersion).attr('selected', true).siblings('option').removeAttr('selected');
				selectble.selectmenu("refresh", true);
				app.ui.updateBackgroundColor();
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
	app.ui.displayDebug('writeUpdateWiRocBLE');
    var version = app.ui.getUpdateWiRocBLE();
    app.ui.displayDebug('writeUpdateWiRocBLE version: ' + version);
    app.writeProperty('upgradewirocble', version, 
		callback,
		function(error) {
			app.ui.displayDebug('writeUpdateWiRocBLE error');
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
	$('#force-4800-bps').checkboxradio();
    $("#force-4800-bps").removeAttr("disabled");
	//$('#force-4800-bps').prop("checked", false);
    $('#force-4800-bps').checkboxradio('refresh');
  } else {
	$('#force-4800-bps').checkboxradio();
    $("#force-4800-bps").attr("disabled", true);
    $('#force-4800-bps').prop("checked", false).checkboxradio("refresh");
  }
};

app.getOneWay = function(callback)
{
	app.writeProperty('onewayreceive', null, 
		callback,
		function(error) {
			app.miscSportIdentErrorBar.show({
				html: 'Error getting one-way: ' + error
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
				html: 'Error saving one-way: ' + error
			});
		}
	);
};

app.ui.displayOneWay = function(oneway)
{
	var raw = parseInt(oneway);
	app.ui.sportident.oneway = raw;
    $('#sportident-oneway').checkboxradio();
	$('#sportident-oneway').prop("checked",raw !== 0).checkboxradio("refresh");
	app.ui.enableDisableForce4800WithParam(raw !== 0);
	app.ui.displayWarningNotes(app.ui.chip, null, null, oneway, null, null, null, null);
	
	app.ui.updateBackgroundColor();
};


//---- force4800

app.getForce4800 = function(callback)
{
	app.writeProperty('force4800baudrate', null, 
		callback,
		function(error) {
			app.miscSportIdentErrorBar.show({
				html: 'Error getting force 4800: ' + error
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
	app.ui.displayDebug('getForce4800 returned ' + force4800.toString());
	app.writeProperty('force4800baudrate', force4800.toString(), 
		callback,
		function(error) {
			app.miscSportIdentErrorBar.show({
				html: 'Error saving force4800: ' + error
			});
		}
	);
};

app.ui.displayForce4800 = function(force4800)
{
	app.ui.displayDebug('displayForce4800 ' + force4800);
	var raw = parseInt(force4800);
	app.ui.sportident.force4800 = raw;

    $('#force-4800-bps').checkboxradio();
    //$("#force-4800-bps").removeAttr("disabled");
	$('#force-4800-bps').prop("checked",raw !== 0).checkboxradio("refresh");
	app.ui.updateBackgroundColor();
};


app.ui.onReadSportIdentButton = function() {
	app.readSportIdentSettings();	
};

app.ui.onApplySportIdentButton = function() {
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



//-- SportIdent RS232
app.ui.displayRS232Mode = function(rs232ModeString)
{
	app.ui.sportident.RS232Mode = rs232ModeString;
	app.ui.displayDebug("rs232ModeString:" + rs232ModeString);
	$(".RS232-mode [type='radio']").checkboxradio();
	$(".RS232-mode [type='radio'][value = '" + rs232ModeString + "']").prop("checked", true).checkboxradio("refresh");
	$(".RS232-mode [type='radio']").not( "[value = '" + rs232ModeString + "']").prop("checked", false).checkboxradio("refresh");
	app.ui.updateBackgroundColor();

};


app.getRS232Mode = function(callback)
{
    app.writeProperty('rs232mode', null, 
		callback,
		function(error) {
			app.radioErrorBar.show({
				html: 'Error getting SportIdent RS232 setting (Mode): ' + error
			});
		}
	);
};

app.ui.getRS232Mode = function() {
	var selected = $(".RS232-mode [type='radio']:checked");
	return selected.val();
};

app.writeRS232Mode = function(callback)
{
    app.writeProperty('rs232mode', app.ui.getRS232Mode(), 
		callback,
		function(error) {
			app.radioErrorBar.show({
				html: 'Error saving SportIdent RS232 setting (Mode): ' + error
			});
		}
	);
};



app.ui.enableDisableForceRS2324800 = function() 
{
  app.ui.enableDisableForceRS2324800WithParam(this.checked);
};

app.ui.enableDisableForceRS2324800WithParam = function(oneWayChecked) 
{
  if (oneWayChecked) {
	$('#force-RS232-4800-bps').checkboxradio();
    $("#force-RS232-4800-bps").removeAttr("disabled");
	//$('#force-4800-bps').prop("checked", false);
    $('#force-RS232-4800-bps').checkboxradio('refresh');
  } else {
	$('#force-RS232-4800-bps').checkboxradio();
    $("#force-RS232-4800-bps").attr("disabled", true);
    $('#force-RS232-4800-bps').prop("checked", false).checkboxradio("refresh");
  }
};

app.getRS232OneWay = function(callback)
{
	app.writeProperty('rs232onewayreceive', null, 
		callback,
		function(error) {
			app.miscSportIdentRS232ErrorBar.show({
				html: 'Error getting one-way: ' + error
			});
		}
	);
};


app.ui.getRS232OneWay = function() {
	return $('#sportident-RS232-oneway').prop("checked") ? 1 : 0;
};

app.writeRS232OneWay = function(callback)
{
	var oneway = app.ui.getRS232OneWay();
	app.writeProperty('rs232onewayreceive', oneway.toString(), 
		callback,
		function(error) {
			app.miscSportIdentRS232ErrorBar.show({
				html: 'Error saving one-way: ' + error
			});
		}
	);
};

app.ui.displayRS232OneWay = function(oneway)
{
	var raw = parseInt(oneway);
	app.ui.sportident.RS232OneWay = raw;
	app.ui.displayDebug("RS232OneWay:" + raw);
    $('#sportident-RS232-oneway').checkboxradio();
	$('#sportident-RS232-oneway').prop("checked",raw !== 0).checkboxradio("refresh");
	app.ui.enableDisableForceRS2324800WithParam(raw !== 0);
	app.ui.displayWarningNotes(app.ui.chip, null, null, null, null, null, raw, null);
	
	app.ui.updateBackgroundColor();
};


//---- force4800

app.getForceRS2324800 = function(callback)
{
	app.writeProperty('forcers2324800baudrate', null, 
		callback,
		function(error) {
			app.miscSportIdentRS232ErrorBar.show({
				html: 'Error getting force RS232 4800: ' + error
			});
		}
	);
};


app.ui.getForceRS2324800 = function() {
	return $('#force-RS232-4800-bps').prop("checked") ? 1 : 0;
};

app.writeForceRS2324800 = function(callback)
{
	var force4800 = app.ui.getForceRS2324800();
	app.ui.displayDebug('getForceRS2324800 returned ' + force4800.toString());
	app.writeProperty('forcers2324800baudrate', force4800.toString(), 
		callback,
		function(error) {
			app.miscSportIdentRS232ErrorBar.show({
				html: 'Error saving force RS232 4800: ' + error
			});
		}
	);
};

app.ui.displayForceRS2324800 = function(force4800)
{
	app.ui.displayDebug('displayForceRS2324800 ' + force4800);
	var raw = parseInt(force4800);
	app.ui.sportident.forceRS2324800 = raw;

    $('#force-RS232-4800-bps').checkboxradio();
    //$("#force-4800-bps").removeAttr("disabled");
	$('#force-RS232-4800-bps').prop("checked",raw !== 0).checkboxradio("refresh");
	app.ui.updateBackgroundColor();
};


app.ui.onReadSportIdentRS232Button = function() {
	app.readSportIdentRS232Settings();	
};

app.ui.onApplySportIdentRS232Button = function() {
	app.writeRS232Mode(function() {
		app.writeRS232OneWay(function() {
			app.writeForceRS2324800(function() {
				app.miscSportIdentRS232SuccessBar.show({
					html: 'SportIdent RS232 saved'
				});
				app.readSportIdentRS232Settings();
			});
		});
	});
};

app.readSportIdentRS232Settings = function() {
	app.getRS232Mode();
	app.getRS232OneWay();
	app.getForceRS2324800();
};

//-- BT Serial

app.getBTSerialOneWay = function(callback)
{
	app.writeProperty('btserialonewayreceive', null, 
		callback,
		function(error) {
			app.btSerialErrorBar.show({
				html: 'Error getting one-way: ' + error
			});
		}
	);
};


app.ui.getBTSerialOneWay = function() {
	return $('#sportident-btserial-oneway').prop("checked") ? 1 : 0;
};

app.writeBTSerialOneWay = function(callback)
{
	var oneway = app.ui.getBTSerialOneWay();
	app.writeProperty('btserialonewayreceive', oneway.toString(), 
		callback,
		function(error) {
			app.btSerialErrorBar.show({
				html: 'Error saving one-way: ' + error
			});
		}
	);
};

app.ui.displayBTSerialOneWay = function(oneway)
{
	var raw = parseInt(oneway);
	app.ui.sportident.BTSerialOneWay = raw;
	app.ui.displayDebug("BTSerialOneWay:" + raw);
    $('#sportident-btserial-oneway').checkboxradio();
	$('#sportident-btserial-oneway').prop("checked",raw !== 0).checkboxradio("refresh");
	app.ui.displayWarningNotes(app.ui.chip, null, null, null, null, null, null, raw);
	app.ui.updateBackgroundColor();
};


app.ui.onReadSportIdentBTSerialButton = function() {
	app.readSportIdentBTSerialSettings();	
};

app.ui.onApplySportIdentBTSerialButton = function() {
	app.writeBTSerialOneWay(function() {
		app.btSerialSuccessBar.show({
			html: 'SportIdent BTSerial saved'
		});
		app.readSportIdentBTSerialSettings();
	});
};

app.readSportIdentBTSerialSettings = function() {
	app.getBTSerialOneWay();
};


//-- Battery

app.getBatteryLevel = function(callback)
{
	app.writeProperty('batterylevel', null, 
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
	$('#sendtosirapenabled').prop("checked",raw !== 0).checkboxradio("refresh");
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
 	if (sirapIPPort === '') {
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
	app.writeProperty('all', app.chunkLength, 
		callback, 
		function(error) {
			app.radioErrorBar.show({
				html: 'Error getting all'
			});
		}
	);
};

//-- Get Wifi networks
app.getNetworkWifiList = function(callback)
{
	app.writeProperty('listwifi', null, 
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
		var element = $('<tr>' +
			       '<td style="white-space:nowrap;overflow:hidden;width:50%;">' +networkName +'</td>' +
			       '<td style="width:15%;text-align:center">' + signalStrength + '</td>' +
			       '<td><a href="#" class="ui-btn wifi-connect-button">' + buttonText + '</a></td>' +
			     '</tr>'
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
		$('#popupWifiLogin').modal();
	}
};

app.ui.onWifiPasswordConnectButton = function(event) {
	$('#popupWifiLogin').modal('hide');
	app.networkInfoBar.settings.autohide = false;
	app.networkInfoBar.settings.onHide = function() {
	        app.getNetworkWifiList();
	};
	app.networkInfoBar.show({
		html: 'Connecting Wifi'
	});
	var networkName = $('#popupWifiLogin').data('networkName');
	var password = $('#wifiPassword').val();
	app.ui.displayDebug(networkName + "  " + password);
	app.writeConnectWifi(networkName, password, function() {
		setTimeout(function () { app.networkInfoBar.hide();}, 6000);			
	});
};

//-- Wifi connect

app.writeConnectWifi = function(networkName, password, callback)
{
	app.writeProperty('connectwifi', networkName + '\t' + password, 
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
	app.writeProperty('disconnectwifi', null, 
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
	app.writeProperty('ip', null, 
		callback, 
		function(error) {
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
app.ui.onRenewIPWifi = function()
{
	app.writeProperty('renewip', 'wifi', 
		null, 
		function(error) {
			app.networkErrorBar.show({
			    html: 'Renewing IP failed'
			});
		}
	);
};

app.ui.onRenewIPEthernet = function()
{
	app.writeProperty('renewip', 'ethernet', 
		null, 
		function(error) {
			app.networkErrorBar.show({
			    html: 'Renewing IP failed'
			});
		}
	);
};

app.ui.displayAll = function(allString) {
	if {allString == null || allString.length == 0) {
		return;
	}
	var all = allString.split('¤');
	//     0             1                2               3            4                       5                 6        7        8         9       10   
	// isCharging¤wirocDeviceName¤sentToSirapIPPort¤sendToSirapIP¤sentToSirapEnabled¤acknowledgementRequested¤dataRate¤channel¤intPercent¤ipAddress¤power¤
	//  11   12            13               14             15         16            17            18       19     20         21            22
	// chip¤range¤wirocPythonVersion¤wirocBLEVersion¤wirocHWVersion¤SIOneWay¤force4800baudrate¤wirocMode¤rxGain¤codeRate¤RS232Mode¤RS232OneWayReceive¤
	//           23                     24                   25
	// forceRS2324800BaudRate¤BTSerialOneWayReceive
	app.ui.displayChip(all[11]);
	app.ui.displayRange(all[12]);
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
    app.ui.displayUpdateWiRocPython('v' + all[13]);
	app.ui.displayUpdateWiRocBLE('v' + all[14]);
	app.wirocHWVersion = all[15];
    app.ui.displayOneWay(all[16]);
	app.ui.displayForce4800(all[17]);
	app.ui.displayLoraMode(all[18]);
	app.ui.displayRxGain(all[19]);
	app.ui.displayCodeRate(all[20]);
	if (all.length > 21) {
		app.ui.displayDebug("all[21]:" + all[21]);
		app.ui.displayRS232Mode(all[21]);
		app.ui.displayDebug("all[22]:" + all[22]);
		app.ui.displayRS232OneWay(all[22]);
		app.ui.displayDebug("all[23]:" + all[23]);
		app.ui.displayForceRS2324800(all[23]);
	}
	if (all.length > 24) {
		app.ui.displayDebug("all[24]:" + all[24]);
		app.ui.displayBTSerialOneWay(all[24]);
		app.ui.displayWarningNotes(all[11], all[5], all[10], all[16], all[19], parseInt(all[20]), all[22], all[24]);
	}
};

app.ui.onReadAllButton = function() {
	app.getAll();
};

app.ui.onApplyBasicButton = function() {
	app.writeLoraMode(function() {
		app.writeChannel(function() {
			app.writeRange(function() {
				app.radioSuccessBar.show({
						html: 'Radio settings saved'
				});

				app.getAll();
			});
		});
	});
};


app.ui.onReadRadioAdvButton = function() {
	app.miscRadioAdvSuccessBar.show({
				html: 'onreadradioadvb'
			});
	app.readRadioAdvSettings();	
};

app.ui.onApplyRadioAdvButton = function() {
    app.writeAcknowledgementRequested(function() {
		app.writePower(function() {
			app.writeRxGain(function() {
				app.writeCodeRate(function() {
					app.miscRadioAdvSuccessBar.show({
						html: 'Radio adv saved'
					});
				});
			});
		});
	});
};

app.readRadioAdvSettings = function() {
	app.miscRadioAdvSuccessBar.show({
				html: 'read radio adv'
			});
	app.getAcknowledgementRequested();
	app.getPower();
	app.getRxGain();
	app.getCodeRate();
};

// Sirap

app.readSirapSettings = function() {
	app.getBatteryLevel();
	app.getSendToSirapEnabled();
	app.getSendToSirapIP();
	app.getSendToSirapIPPort();
	app.getLoraMode();
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
				app.getLoraMode();
			}, function() {
				app.getSendToSirapEnabled();
				app.getSendToSirapIP();
				app.getSendToSirapIPPort();
				app.getLoraMode();
			});
		});
	});
};



app.ui.onGetNetworkWifiListButton = function() {
	app.getNetworkWifiList();
};


app.setWiRocNameInMonitorDatabase = function(btAddress, wirocName) {
	var url = "https://monitor.wiroc.se/api/v1/Devices/" + btAddress + "/UpdateDeviceName/" + wirocName;
	app.ui.displayDebug('setWiRocNameInMonitorDatabase: ' + url);
	if (window.cordova) {
		// do something cordova style
		app.ui.displayDebug('setWiRocNameInMonitorDatabase: 1');
		cordovaHTTP.get(
		   url, 
		   {},
		   { Authorization: app.backendApiKey },
		   function (response) {
		   },
		   function (error) {
		   }
		);
	}
	else {
		app.ui.displayDebug('setWiRocNameInMonitorDatabase: 2');
		return fetch(url,
		{
			credentials: 'same-origin',
			headers: {
			  'Accept': 'application/json',
			  'Authorization': app.backendApiKey
			},
			method: "GET"
		})
		.catch(function(res){ });
	}
};


// Device name
app.ui.onApplyDeviceNameButton = function()
{
	var devName = app.ui.getWiRocDeviceName();
	
	app.writeWiRocDeviceName(function() {
		app.miscDeviceNameSuccessBar.show({
			html: 'Device name saved'
		});
		// save to backend
		app.setWiRocNameInMonitorDatabase(app.connectedDevice.id, devName);
		app.getWiRocDeviceName();
	});
};

app.getWiRocDeviceName = function(callback) {
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
	var devName = $('#wirocdevicename').val().trim();
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
	html += "<tr><th align=\"left\">Type</th><th align=\"left\">Instance</th><th align=\"left\">Msg In</th><th align=\"left\">Msg In Subtype</th><th align=\"left\">Msg Out</th><th align=\"left\">Msg Out Subtype</th><th align=\"left\">Enabled</th></tr></thead><tbody>";
	for (i = 0; i < statusObj.subscriberAdapters.length ; i++) {
		var subscriber = statusObj.subscriberAdapters[i];
		html += "<tr><td>" + subscriber.TypeName + "</td><td>" + subscriber.InstanceName + "</td><td>" + subscriber.MessageInName + "</td><td>" + subscriber.MessageInSubTypeName + "</td><td>" + subscriber.MessageOutName + "</td><td>" + subscriber.MessageOutSubTypeName + "</td><td>" + subscriber.Enabled + "</td></tr>";
	}
	html += "</tbody></table>";
	$('#wiroc-status-content').html(html);
};

app.ui.onRefreshStatusButton = function() {
	$('#wiroc-status-content').html('');
	app.getWiRocStatus();
	$('#wiroc-services-content').html('');
	app.getServices();
};

// Services
app.getServices = function(callback) {
	app.writeProperty('services', null, 
		callback, 
		function(error) {
			app.miscStatusErrorBar.show({
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
	if (errorCallback === null) {
		errorCB = function(error) {
			app.miscSettingsErrorBar.show({
				html: 'Error saving setting: ' + error
			});
		};
	}
	
	var settingKeyAndValue = key+'\t'+value;
	app.writeProperty('setting', settingKeyAndValue, 
		callback,
		errorCB
	);
};

app.ui.displayWiRocSettings = function(settings) {
	$('#wiroc-status-content').html(settings);
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
};

app.ui.onEditSetting = function(event)
{
	var key = event.data.Key;
	var value = event.data.Value;
	$('#settingKey').val(key);
	$('#settingValue').val(value);
	$('#popupAddEditSetting').data('Key', key);
	$('#popupAddEditSetting').data('Value', value);
	$('#popupAddEditSetting').modal();
};

app.ui.onEditSettingSaveButton = function(event) {
	$('#popupAddEditSetting').modal('hide');
	var key = $('#settingKey').val();
	var value = $('#settingValue').val();
	app.ui.displayDebug(key + " -- " + value);
	app.writeWiRocSetting(key, value, function() {
		app.miscSettingsSuccessBar.show({
			html: 'Setting saved'
		});
		$('#wiroc-settings-content').html('');
	}, null);
};


//-- Get BT Serial
app.ui.onGetBTSerialListButton = function() {
	$('#btserial-list').html('');
	app.btSerialNoOfTimesRefreshed = 0;
	app.btSerialListStop = false;
	$('#stopBTSerialList').removeClass('ui-disabled');
	app.getBTSerialList(function() {});
};

app.ui.onBTSerialListStopButton = function() {
	app.btSerialNoOfTimesRefreshed = 0;
	$('#stopBTSerialList').addClass('ui-disabled');
	app.btSerialListStop = true;
};


app.getBTSerialList = function(callback)
{
	$('#getBTSerialListLoading').show();
	app.writeProperty('scanbtaddresses', null, 
		callback, 
		function(error) {
			app.btSerialErrorBar.show({
			    html: 'Error getting BT Serial list: ' + error
			});
		}
	);
};

app.ui.displayBTSerialList = function(btSerialListString)
{
	app.ui.displayDebug(btSerialListString);
	$('#getBTSerialListLoading').hide();
	var updateListAgain = false;
	var arrayOfBTSerial = JSON.parse(btSerialListString);
	if (arrayOfBTSerial.length == 0) {
		$('#btserial-list').html('No BT Serial devices found');
	} else {
		var table = $('<table  style="border:0px;padding:0px;width:100%;"></table>');
		$('#btserial-list').html(table);
		for (var i = 0; i < arrayOfBTSerial.length; i++) {
			var btSerialObj = arrayOfBTSerial[i];
			var BTName = btSerialObj.Name;
			app.ui.displayDebug(name);
			var btAddr = btSerialObj.BTAddress;
			app.ui.displayDebug(btAddr);
			var status = btSerialObj.Status;
			app.ui.displayDebug(status);
			var foundText = '';
			if (btSerialObj.Found === 'False') {
				foundText = 'Not found, ';
			}
			
			var element = null;
			var connect = true;
			if (status === "NotConnected") {
				if (btSerialObj.Found === 'False') {
					element = $('<tr>' +
					   '<td style="white-space:nowrap;">' + BTName + '</td>' +
					   '<td style="text-align:center;padding-right:5px;padding-left:5px">' + btAddr + '<br/>' + foundText + 'Not connected</td>' +
					   '<td style="text-align:right;"><a href="#" class="ui-btn btserial-connect-button">REMOVE</a></td>' +
					 '</tr>'
					);
					connect = false;
				} else {
					element = $('<tr>' +
					   '<td style="white-space:nowrap;">' + BTName + '</td>' +
					   '<td style="text-align:center;padding-right:5px;padding-left:5px">' + btAddr + '<br/>' + foundText + 'Not connected</td>' +
					   '<td style="text-align:right;"><a href="#" class="ui-btn btserial-connect-button">CONNECT</a></td>' +
					 '</tr>'
					);
					updateListAgain = true;
					connect = true;
				}
			} else if (status === "Connected") {
				element = $('<tr>' +
					   '<td style="white-space:nowrap;">' + BTName + '</td>' +
					   '<td style="text-align:center;padding-right:5px;padding-left:5px">' + btAddr + '<br/>Connected</td>' +
					   '<td style="text-align:right;"><a href="#" class="ui-btn btserial-connect-button">DISCONNECT</a></td>' +
					 '</tr>'
				);
				connect = false;
			} else if (status === "ReadError") {
				element = $('<tr>' +
					   '<td style="white-space:nowrap;">' + BTName + '</td>' +
					   '<td style="text-align:center;padding-right:5px;padding-left:5px">' + btAddr + '<br/>' + foundText + 'Error</td>' +
					   '<td style="text-align:right;"><a href="#" class="ui-btn btserial-connect-button">REMOVE</a></td>' +
					 '</tr>'
				);
				connect = false;
			}
			table.append(element);
			
			element.find('a.btserial-connect-button').bind("click",
				{BTAddress: btAddr, BTName: BTName, connect: connect},
				app.ui.onBTSerialConnectButton);

		}
		
		app.btSerialNoOfTimesRefreshed += 1;
		if (updateListAgain === true && app.btSerialNoOfTimesRefreshed > 8) {
			updateListAgain = false;
		}
		
		
		if (updateListAgain && !app.btSerialListStop) {
			setTimeout(
				function()
				{
					app.getBTSerialList(function() {});
				},
			2000);
		} else {
			$('#stopBTSerialList').addClass('ui-disabled');
		}
	}
};


//-- BT Serial connect/ disconnect
app.ui.onBTSerialConnectButton = function(event) {
	app.btSerialNoOfTimesRefreshed = 0;
	var btAddr = event.data.BTAddress;
	var btName = event.data.BTName;
	var connect = event.data.connect;
	if (connect) {
		app.writeConnectBTSerial(btAddr+'\t'+btName, function() {
			app.btSerialInfoBar.settings.autohide = true;
			app.btSerialInfoBar.settings.onHide = function() {
			        app.getBTSerialList();
    			};
			app.btSerialInfoBar.show({
				html: 'Connecting BT Serial'
			});
		});
	} else {
		app.writeDisconnectBTSerial(btAddr, function() {
			app.btSerialInfoBar.settings.autohide = true;
			app.btSerialInfoBar.settings.onHide = function() {
			        app.getBTSerialList();
    			};
			app.btSerialInfoBar.show({
				html: 'Disconnect/Remove BT Serial'
			});
		});
	}
};

//-- BT Serial connect

app.writeConnectBTSerial = function(btAddrAndbtName, callback)
{
	app.writeProperty('bindrfcomm', btAddrAndbtName, 
		callback, 
		function(error) {
			app.btSerialErrorBar.show({
			    html: 'Error connecting to BT Serial: ' + error
			});
			app.btSerialInfoBar.hide();
		}
	);
};

//-- BT Serial disconnect
app.writeDisconnectBTSerial = function(btAddress, callback)
{
	app.writeProperty('releaserfcomm', btAddress, 
		callback,
		function(error) {
			app.btSerialErrorBar.show({
			    html: 'Error disconnecting BT Serial: ' + error
			});
		}
	);
};

//----------

app.appendBuffer = function(buffer1, buffer2) {
  var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
};


app.ui.displayPunches = function(punches) {
	if (app.punches === null) {
		app.punches = punches;
	} else {
		app.punches = app.appendBuffer(app.punches, punches);
	}
	if (punches.byteLength < app.chunkLength) {
		// we received all data
		var rawPunches =  app.fromUtf8(app.punches);
		app.punches = null; // reset buffer
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
	if ($('#btnSubscribePunches').data('subscribe'))
	{
		app.ui.displayDebug("Subcribe punches");
		ble.startNotification(
			app.connectedDevice.id, 
			app.apiService, 
			app.punchesCharacteristic, 
			function(data) {
				app.ui.displayPunches(data);
			},
			function(error) {
				app.miscPunchesErrorBar.show({
					html: 'Error subscribePunches: ' + error
				});
			}
		);
	
		$('#btnSubscribePunches').text("Unsubscribe");
		$('#btnSubscribePunches').data("subscribe", false);
	} else {
		app.ui.displayDebug("Unubcribe punches");
		app.punches = null;
		ble.stopNotification(
			app.connectedDevice.id, 
			app.apiService, 
			app.punchesCharacteristic,
			function(data) {
				$('#btnSubscribePunches').text("Subscribe");
				$('#btnSubscribePunches').data("subscribe", true);
			},
			function(error) {
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
	app.writeProperty('deletepunches', null, 
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
	app.writeProperty('dropalltables', null, 
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
	app.writeProperty('uploadlogarchive', null, 
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
	if (app.testPunches === null) {
		app.testPunches = testPunches;
	} else {
		app.testPunches = app.appendBuffer(app.testPunches, testPunches);
	}
	if (testPunches.byteLength < app.chunkLength) {
		// we received all data from this push

		var rawTestPunches =  app.fromUtf8(app.testPunches);
		app.testPunches = null; // reset buffer
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
			} else {
				table.append(rowElement);
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
			if ((status == 'Acked' && ackReq) || (status =='Not acked' && !ackReq) || 
				(parseInt(noOfSendTries) > 1 && (status == 'Not sent' || status == 'Not acked'))) {
				noOfCompletedRows++;
			}
		}

		// Check if we received all
		if (allTrs.length == app.ui.misc.noOfTestPunchesToSend &&
			app.ui.misc.noOfTestPunchesToSend == noOfCompletedRows)
		{
			ble.stopNotification(
				app.connectedDevice.id, 
				app.apiService, 
				app.testPunchesCharacteristic,
				function(data) {
					$('#stopTestPunch').addClass('ui-disabled');
					$('#testPunchLoading').hide();
				},
				function(error) {
					app.miscTestPunchesErrorBar.show({
						html: 'Error unsubscribe: ' + error
					});
				}
			);
		}
	}
};

app.ui.onSendTestPunchesStopButton = function(event) {
	app.testPunches = null;
	ble.stopNotification(
		app.connectedDevice.id, 
		app.apiService, 
		app.testPunchesCharacteristic,
		function(data) {
			$('#stopTestPunch').addClass('ui-disabled');
			$('#testPunchLoading').hide();
		},
		function(error) {
			app.miscTestPunchesErrorBar.show({
				html: 'Error unsubscribe: ' + error
			});
		}
	);
};

app.ui.onSendTestPunchesButton = function(event) {
	app.testPunches = null;

	$("#wiroc-test-punches-table tbody").html('');
	$('#stopTestPunch').removeClass('ui-disabled');
	$('#testPunchLoading').show();


	app.ui.misc.noOfTestPunchesToSend = $("#noOfTestPunches option:selected").val();
	var siNumber = $("#siNumber").val();
	var sendInterval = $("#sendInterval option:selected").val();
	var param = app.ui.misc.noOfTestPunchesToSend + '\t' + sendInterval + '\t' + siNumber;

	var te = new TextEncoder("utf-8").encode(param);
	var parameters = new Uint8Array(te);
	
	ble.write(
		app.connectedDevice.id, 
		app.apiService, 
		app.testPunchesCharacteristic, 
		parameters.buffer, 
		function() {
			app.miscTestPunchesSuccessBar.settings.autohide = true;
			app.miscTestPunchesSuccessBar.show({
			    html: 'Sending test punches initiated'
			});
			ble.startNotification(
				app.connectedDevice.id, 
				app.apiService, 
				app.testPunchesCharacteristic, 
				function(data) {
					app.ui.displayTestPunches(data);
				},
				function(error) {
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

// PROPERTY functions
app.enablePropertyNotification = function()
{
	ble.startNotification(
		app.connectedDevice.id, 
		app.apiService, 
		app.propertyCharacteristic, 
		function(data) {
			if (app.propertyResponse === null) {
				app.propertyResponse = data;
			} else {
				app.propertyResponse = app.appendBuffer(app.propertyResponse, data);
			}

			var a = new TextDecoder("utf-8").decode(data);
			var b = new TextDecoder("utf-8").decode(app.propertyResponse);
			$('#wiroc-status-content').html($('#wiroc-status-content').html() + ' || propertyNotification: data.byteLength: ' + data.byteLength + ' chunkLength: ' + app.chunkLength + ' data:' + a + ' total: ' + b);

			if (data.byteLength < app.chunkLength) {
				// we received all data
				var propertyResponseString = new TextDecoder("utf-8").decode(app.propertyResponse);
				app.propertyResponse = null;
				app.ui.displayProperty(propertyResponseString);
			}
		},
		function(error) {
			app.radioErrorBar.show({
				html: 'Error subscribe property: ' + error
			});
		}
	);
};

app.disablePropertyNotification = function()
{
	ble.stopNotification(
		app.connectedDevice.id, 
		app.apiService, 
		app.propertyCharacteristic,
		function(data) {
		},
		function(error) {
			app.radioErrorBar.show({
				html: 'Error unsubscribe property: ' + error
			});
		}
	);
};

app.writeProperty = function(propName, propValue, successCallback, errorCallback)
{
	var propNameAndPropValue = propName + '\t' + (propValue === null ? '' : propValue);
	var te = new TextEncoder("utf-8").encode(propNameAndPropValue);
	var parameters = new Uint8Array(te);
	
	ble.write(
		app.connectedDevice.id, 
		app.apiService, 
		app.propertyCharacteristic, 
		parameters.buffer, 
		function() { 
			if (successCallback !== null) {
				successCallback();
			}
		},
		errorCallback
	);
};

app.ui.displayProperty = function(propAndValueStrings)
{
	// should never receive multiple replies anylonger, so split
	// with '|' could be removed
	if (propAndValueStrings == null || propAndValueStrings.length == 0) {
		return;
	}
	app.ui.displayDebug('displayProperty:' + propAndValueStrings);
	var propAndValuesArray = propAndValueStrings.split('|');
	for (var i = 0; i < propAndValuesArray.length; i++) {
		var propAndValue = propAndValuesArray[i];
		var idx = propAndValue.indexOf('\t');
		var propName = propAndValue;
		var propValue = '';
		if (idx > 0) {
			propName = propAndValue.substring(0, idx);
			propValue = propAndValue.substring(idx+1).trim();
		}
		switch(propName) {
			case 'wirocdevicename':
				app.ui.displayWiRocDeviceName(propValue);
				break;
			case 'channel':
				app.ui.displayChannel(propValue);
				break;
			case 'loramode':
				app.ui.displayLoraMode(propValue);
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
			case 'forcers2324800baudrate':
				app.ui.displayForceRS2324800(propValue);
				break;
			case 'status':
				app.ui.displayWiRocStatus(propValue);
				break;	
			case 'settings':
				app.ui.displayWiRocSettings(propValue);
				break;
			case 'setting':
				// reload table
				app.getWiRocSettings();
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
				app.networkInfoBar.settings.autohide = true;
				app.networkInfoBar.show({
				    html: 'Renew IP command issued'
				});
			    break;
			case 'deletepunches':
			    app.miscDatabaseSuccessBar.settings.autohide = true;
			    app.miscDatabaseSuccessBar.show({
			       html: 'Punches deleted'
			    });
			    break;
			case 'dropalltables':
			    app.miscDatabaseAdvSuccessBar.settings.autohide = true;
			    app.miscDatabaseAdvSuccessBar.show({
			       html: 'Tables dropped'
			    });
			    break;
			case 'all':
			    app.ui.displayAll(propValue);
			    break;
			case 'uploadlogarchive':
				app.miscDatabaseAdvSuccessBar.settings.autohide = true;
				app.miscDatabaseAdvSuccessBar.show({
					html: 'Zip with database and logs uploaded'
				});
				break;
			case 'upgradewirocpython':
			    app.getAll();
    			break;
			case 'upgradewirocpython':
				app.getAll();
				break;	
			case 'services':
				app.ui.displayServices(propValue);
				break;
			case 'onewayreceive':
				app.ui.displayOneWay(propValue);
				break;
			case 'rs232mode':
				app.ui.displayRS232Mode(propValue);
				break;
			case 'rs232onewayreceive':
				app.ui.displayRS232OneWay(propValue);
				break;
			case 'btserialonewayreceive':
				app.ui.displayBTSerialOneWay(propValue);
				break;
			case 'batterylevel':
				app.ui.displayBatteryLevel(propValue);
				break;
			case 'rxgainenabled':
				app.ui.displayRxGain(propValue);
				break;
			case 'coderate':
				app.ui.displayCodeRate(propValue);
				break;
			case 'scanbtaddresses':
				app.ui.displayBTSerialList(propValue);
				break;	
			case 'bindrfcomm':
				app.ui.displayBTSerialList(propValue);
				break;				
			case 'releaserfcomm':
				app.ui.displayBTSerialList(propValue);
				break;			
				
			default:
		}
	}
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
	
	app.ui.displayStatus('before ble.connect 1');
	// Android connect error 133 might be prevented by waiting a
	// little before connect (to make sure previous BLE operation
	// has completed).
	setTimeout(
		function()
		{
			app.ui.displayStatus('before ble.connect 2');
			try 
			{	
				ble.connect(
					device.id, 
					app.onConnected, 
					app.onDisconnected);
				app.ui.displayStatus('after ble.connect 3');
			} catch (ex)
			{
				app.ui.displayStatus('ble.connect ex: ' + ex.message);
			}
		},
	1000);      
};


// Called when device is connected.
app.onConnected = function(device)
{
	app.ui.displayDebug('onConnected1');
	app.devices = {};
	app.ui.displayDeviceList();
	
	app.connectedDevice = device;
	app.ui.displayDebug('onConnected4');
	ble.requestMtu(app.connectedDevice.id, 512,
		function(mtu){
			app.ui.displayDebug("MTU set to: " + mtu);
			app.chunkLength = mtu - 3;
			$(":mobile-pagecontainer").pagecontainer( "change", "#page-basic-config", { } );
			app.ui.displayDebug('Scan stopped 5');
			
			app.enablePropertyNotification();
			setTimeout(
				 function() 
				 { 
					app.getAll(function() {
						$('#tab-radio').css('ui-btn-active');
						$('#tab-radio').trigger('click');
					});
				 },
             1000);
		},
		function(failure){
			app.ui.displayDebug("Failed to request MTU: " + failure);
		}
	);
};


// Called if device disconnects.
app.onDisconnected = function(device)
{
	app.ui.displayDebug('onDisconnected1');
	
	app.connectedDevice = null;
	$.mobile.pageContainer.pagecontainer("change", "#page-device-scan", { });
	app.searchDevicesErrorBar.show({
		html: 'Device disconnected'
	});
};


// Called when a connect error occurs.
app.onConnectError = function(error)
{
    app.connectErrorCount++;
    
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
		setTimeout(
             function() 
             { 
                app.connect(app.devices[app.btAddressToConnect]); 
             },
             1000);
    } else {
		app.searchDevicesErrorBar.show({
			html: 'Connect error: ' + error
		});
		app.connectErrorCount = 0;
		app.devices = {};
		app.ui.displayDeviceList();
    }
};

app.disconnect = function()
{
	if (app.connectedDevice) {
		//evothings.ble.close(app.connectedDevice);
		ble.disconnect(app.connectedDevice.id, 
			function() {
				app.connectedDevice = null;
				app.searchDevicesInfoBar.show({
					html: 'Disconnected'
				});
			}, 
			function() {
				app.searchDevicesInfoBar.show({
					html: 'Disconnecting failed'
				});	
			}
		);
	}
};

app.initialize();

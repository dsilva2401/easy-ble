// Libs
var bleno = require('bleno');
var util = require('util');
var Q = require('q');

// Constants
var sessionData = null;
var sessionCallback = null;

// Characteristics
  // Write
  var SetSessionCharacteristic = function() {
    SetSessionCharacteristic.super_.call(this, {
      uuid: 'ff51b30e-d7e2-4d93-8842-a7c4a57dfb10',
      properties: ['write'],
    });
    this._value = new Buffer(0);
  };
  SetSessionCharacteristic.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {
    data = data.toString();
    if (!data || (typeof data != 'string') ) {
      callback(this.RESULT_UNLIKELY_ERROR);
      return;
    }
    sessionData = data;
    callback(this.RESULT_SUCCESS);
  };
  util.inherits(SetSessionCharacteristic, bleno.Characteristic);
  // Read
  var ResolveSessionRequest = function() {
    ResolveSessionRequest.super_.call(this, {
       uuid: 'ff51b30e-d7e2-4d93-8842-a7c4a57dfb08',
       properties: ['read']
     });
    this._value = new Buffer(0);
   };
   ResolveSessionRequest.prototype.onReadRequest = function(offset, callback) {
      if (!offset) {
        sessionCallback(sessionData, function (cbData) {
          cbData = cbData || '';
          if (typeof cbData != 'string') {
            cbData = '';
          }
          this._value = new Buffer(cbData);
          callback(this.RESULT_SUCCESS, this._value.slice(offset, this._value.length));
        });
        return;
      }
      callback(this.RESULT_INVALID_OFFSET, this._value.slice(offset, this._value.length));
   };
   util.inherits(ResolveSessionRequest, bleno.Characteristic);

// Services
  // Write
  function WriteService() {
    bleno.PrimaryService.call(this, {
      uuid: 'ff51b30e-d7e2-4d93-8842-a7c4a57dfb09',
      characteristics: [
        new SetSessionCharacteristic(),
      ]
    });
  };
  util.inherits(WriteService, bleno.PrimaryService);
  // Read
  function ReadService() {
    bleno.PrimaryService.call(this, {
      uuid: 'ff51b30e-d7e2-4d93-8842-a7c4a57dfb07',
      characteristics: [
        new ResolveSessionRequest(),
      ]
    });
  };
  util.inherits(ReadService, bleno.PrimaryService);


// Client bluetooth class
function ClientBluetooth (deviceName) {

  // Attributes
  this.deviceName = deviceName;

  // Methods
  this.makeAvailable = function () {
    var deferred = Q.defer();
    bleno.on('stateChange', function(state) {
      if (state === 'poweredOn') {
        bleno.startAdvertising(deviceName);
      }
      else {
        bleno.stopAdvertising();
        deferred.reject({
          details: 'Bluetooth is not available'
        });
      }
    });
    bleno.on('advertisingStart', function(error) {
      if (error) {
        deferred.reject(error);
        return;
      }
      bleno.setServices([
        new WriteService(),
        new ReadService()
      ]);
      deferred.resolve();
    });
    return deferred.promise;
  }
  this.onMasterMessage = function (callback) {
    sessionCallback = callback;
  } 
}

exports.ClientBluetooth = ClientBluetooth;
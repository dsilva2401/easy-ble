var bModule = require('../');

var bClient = new bModule.ClientBluetooth('My device');

bClient.makeAvailable().then(function () {
  console.log('Device is available');
}).catch(function (err) {
  console.warn('Error making device available:', err);
});

bClient.onMasterMessage(function (data, done) {
  console.log('Data recieved:', data);
  done(data, ':)');
});
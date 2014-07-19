'use strict';

var omsGate = require('../lib/oms-gate.js');

var gate = new omsGate.OmsGate();

gate.init({
    user: 'user',
    password: 'password'
}, function(err, gate) {
    if (err) {
        console.error(err);
    }

    gate.getServiceInfo(function(err, data) {
        if (err) {
            console.error(err);
            return;
        }
        console.log(data);
    });

    gate.getUserInfo(function(err, data) {
        if (err) {
            console.error(err);
            return;
        }
        console.log(data);
    });

    gate.deliverXms('75555555555', 'Hello, World!', function(err, data) {
        if (err) {
            console.error(err);
            return;
        }
        console.log(data);
    });

});
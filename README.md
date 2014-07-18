# node-oms

> Sends SMS via OMS-compliant gateway (Outlook 2007 / Office 2010 Mobile Service SOAP API)

## Getting Started

Install the module with: `npm install oms-gate`


## Documentation

### OmsGate.init

### OmsGate.getServiceInfo(Function callback)

### OmsGate.getUserInfo(Function callback)

### OmsGate.deliverXms(String recipientNumber, String message, Function callback)


## Examples

    var OmsGate = require('oms-gate');
    
    var gate = new OmsGate();
    
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


## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com).


## License

Copyright (c) 2014 Vladimir Shushkov  
Licensed under the MIT license.

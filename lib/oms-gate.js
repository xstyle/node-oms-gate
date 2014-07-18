/*
 * oms-gate
 * https://github.com/vshushkov/node-oms-gate
 *
 * Copyright (c) 2014 Vladimir Shushkov
 * Licensed under the MIT license.
 */

'use strict';

var soap = require('soap');
var sax = require('sax');
var util = require('util');
var crypto = require('crypto');

var xmlToPlainObject = function(xml, callback) {

    var parser = sax.parser(true),
        names = [], values = {};

    parser.ontext = function(text) {
        var key = names.join('.');
        if (values[key]) {
            if (!util.isArray(values[key])) {
                values[key] = [values[key]];
            }
            values[key].push(text);
        } else {
            values[key] = text;
        }
    };

    parser.onopentag = function(node) {
        names.push(node.name);
        Object.keys(node.attributes).forEach(function(key) {
            values[names.join('.') + '.' + key] = node.attributes[key];
        });
    };
    parser.onclosetag = function(nodeName) {
        names.pop();
    };
    parser.onattribute = function (attr) {

    };
    parser.onend = function () {
        callback && typeof callback == 'function' && callback(values);
    };

    console.log(xml);

    parser.write(xml.trim()).close();
};

var OmsGate = function() {
    this.user = null;
    this.password = null;
    this.url = null;
    this.wsdl = null;
    this.client = null;
    this.serviceConfig = null;
};


OmsGate.prototype.init = function(options, callback) {
    if (!options) {
        options = {};
    }

    this.user = options.user;
    this.password = options.password;

    this.url = options.url || 'https://sms.megafon.ru/oms/service.asmx';
    this.wsdl = options.wsdl || __dirname +'/../wsdl/oms-megafon.wsdl';

    var self = this;

    soap.createClient(this.wsdl, {endpoint: this.url, attributesKey: '$attrs'}, function(err, client) {
        if (err) {
            callback && typeof callback == 'function' && callback(err);
            return;
        }
        self.client = client;

        self.getServiceInfo(function(err) {
            if (err) {
                callback && typeof callback == 'function' && callback(err);
                return;
            }
            callback && typeof callback == 'function' && callback(null, self);
        });
    });

};

OmsGate.prototype.getServiceInfo = function(callback) {
    if (this.client == null) {
        callback && typeof callback == 'function' && callback(new Error('Client not initialized. Use method init()'));
        return;
    }

    var self = this;

    this.client.OMS.OMSSoap.GetServiceInfo({}, function(err, result) {
        if (err) {
            callback && typeof callback == 'function' && callback(err);
            return;
        }
        xmlToPlainObject(result.GetServiceInfoResult, function(data) {
            self.serviceConfig = data;
            callback && typeof callback == 'function' && callback(null, data);
        });
    })

};

OmsGate.prototype.getUserInfo = function(callback) {
    if (this.client == null) {
        callback && typeof callback == 'function' && callback(new Error('Client not initialized. Use method init()'));
        return;
    }

    this.client.OMS.OMSSoap.GetUserInfo({
        xmsUser: this.client.wsdl.objectToXML({
            xmsUser: {
                userId: this.user,
                replyPhone: this.user,
                password: this.password
            }
        })
    }, function(err, result) {
        if (err) {
            callback && typeof callback == 'function' && callback(err);
            return;
        }
        xmlToPlainObject(result.GetUserInfoResult || result.UserInfoResult, function(data) {
            callback && typeof callback == 'function' && callback(null, data);
        });
    })

};

OmsGate.prototype.deliverXms = function(recipientNumber, message, callback) {

    if (this.client == null) {
        callback && typeof callback == 'function' && callback(new Error('Client not initialized. Use method init()'));
        return;
    }

    recipientNumber = recipientNumber.replace('(', '').replace(')', '')
        .split('-').join('').split(' ').join('').replace('+', '');

    if (!/^([0-9]{11,14})$/.exec(recipientNumber)) {
        callback && typeof callback == 'function' && callback(new Error('Wrong recipient number'));
        return;
    }

    var chunkSize = this.serviceConfig['serviceInfo.supportedService.SMS_SENDER.maxDbcsPerMessage'],
        requiredService = 'SMS_SENDER',
        content = [],
        chunk,
        messageHash = crypto.createHash('md5').update(message).digest('hex').toUpperCase();

    for (var start = 0, incr = 0, length = message.length; start <= length; incr++, start += chunkSize) {
        chunk = (chunkSize < length ? '('+ (incr + 1) +'/'+ Math.ceil(length / chunkSize) +')' : '')
            + message.substr(start, chunkSize);

        content.push({
            $attrs: {
                contentType: 'text/plain',
                contentId: 'Att'+ incr +'.txt@'+ messageHash.substr(0, 16) +'.'+ messageHash.substr(16),
                contentLocation: incr +'.txt'
            },
            $value: chunk
        });
    }

    this.client.OMS.OMSSoap.DeliverXms({
        xmsData: this.client.wsdl.objectToXML({
            xmsData: {
                user: {
                    userId: this.user,
                    replyPhone: this.user,
                    password: this.password
                },
                xmsHead: {
                    scheduled: new Date().toISOString().replace(/\.\d+Z/, 'Z'),
                    requiredService: requiredService,
                    to: {
                        recipient: recipientNumber
                    }
                },
                xmsBody: {
                    $attrs: {
                        format: 'SMS'
                    },
                    content: content
                }
            }
        })
    }, function(err, result) {
        if (err) {
            callback && typeof callback == 'function' && callback(err);
            return;
        }

        xmlToPlainObject(result.DeliverXmsResult, function(data) {
            callback && typeof callback == 'function' && callback(null, data);
        });
    })

};

exports.module = OmsGate;

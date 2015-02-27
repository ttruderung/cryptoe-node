var assert = require('assert');
var co = require('co');

describe('Crypto', function(){

    describe('random', function(){

        it('generates a message of the requested length', function() {
            var m = cryptoe.random(100);
            assert.equal(m.len(), 100);
        });

        it('requires parameter (length)', function() {
            assert.throws(function() {
                cryptoe.random();
            });
        });

    });  

    describe('Symmetric encryption', function(){

        it('works for some messages', function() {
            var m = cryptoe.messageFromString('ala ma kota w kącie');
            var key = cryptoe.generateSymmetricKey();
            var e = key.encrypt(m);
            var d = key.decrypt(e);
            assert.equal(m.toHexString(), d.toHexString());
        });

        it('works for long messages', function() {
            var m = cryptoe.random(50000);
            var key = cryptoe.generateSymmetricKey();
            var e = key.encrypt(m);
            var d = key.decrypt(e);
            assert.equal(m.toHexString(), d.toHexString());
        });

        it('conversion of keys to/from messages works as expected', function() {
            var m = cryptoe.messageFromString('ala ma kota w kącie');
            var key = cryptoe.generateSymmetricKey();
            // encode and decode the key
            var key1 = cryptoe.symmetricKeyFromMessage(key.asMessage());
            // encrypt with the original key, decrypt with the encoded and decoded
            var d = key1.decrypt(key.encrypt(m));
            assert.equal(m.toString(), d.toString());
        });

    });  

});  

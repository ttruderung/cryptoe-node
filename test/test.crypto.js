var assert = require('assert');

describe('Crypto', function(){

    describe('random', function(){

        it('generates a message of the requested length', function() {
            var m = cryptoe.random(100);
            assert.equal(m.len(), 100);
        });

        it('requires parameter (length)', function() {
            assert.throws(function() {
                cryptoe.random();
            }, cryptoe.Error);
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

        it('works for some fixtures', function() {
            var key, m, c, d;
            key = cryptoe.symmetricKeyFromMessage(cryptoe.messageFromHexString('68bbb32ae81b85752be3bc632293a31353f9df0a96976193474782cc13a5cdda'));
            c   = cryptoe.messageFromHexString('3d66b89160a0ad129bbab5015f416b56ada6a0b136bc44982ec003a86802e99e008801');
            d = key.decrypt(c);
            assert.equal(d.toString(), 'łąka!');

            key = cryptoe.symmetricKeyFromMessage(cryptoe.messageFromHexString("f86a785d6d684d08dfc39fff6336b1b8ae18c469f356fe3dc30ec49ce3bf0dfa"));
            c   = cryptoe.messageFromHexString("183f1f1583b28f61587d49f32fa0690a079eea13a62b02fa1219f30ee3f6d14fbd29cb");
            d = key.decrypt(c);
            assert.equal(d.toString(), 'łąka!');
        });

        it('rejects invalid ciphertexts', function() {
            var key = cryptoe.symmetricKeyFromMessage(cryptoe.messageFromHexString('68bbb32ae81b85752be3bc632293a31353f9df0a96976193474782cc13a5cdda'));
            var c   = cryptoe.messageFromHexString('3d66b89160a0ad129bbab5115f416b56ada6a0b136bc44982ec003a86802e99e008801');
            assert.throws(function(){
                key.decrypt(c);
            }, cryptoe.Error);
        });
    });  

});  

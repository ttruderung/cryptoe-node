var cryptoe = require('../cryptoe');
var assert = require("assert")

var m = cryptoe.emptyMessage();

describe('Message', function(){
  describe('empty', function(){
    it('should return an empty message ', function(){
        var m = cryptoe.emptyMessage();
        assert.equal( m.len(), 0 );
    })
  });

  describe('messageFromASCII', function(){
    it('should encode one byte per character and decode to the same string', function(){
        var m = cryptoe.messageFromString('abc', 'ascii');
        assert( m.len() === 3  );
        var s = m.toString('ascii');
        assert( 'abc' === s );
    });
  });

  describe('messageFromUTF16', function(){
    it('should encode two byte per character and decode to the same string', function(){
        var m = cryptoe.messageFromString('abć', 'utf16');
        assert.equal(6, m.len());
        var s = m.toString('utf16');
        assert.equal('abć', s);
    });
  });

  describe('messageFromHexString', function(){
    it('should produce a message of the appropriate length and decode to the same string', function(){
        var s0 = '10afbcfa89';
        var m = cryptoe.messageFromHexString(s0);
        assert.equal(5, m.len());
        var s1 = m.toHexString();
        assert.equal(s0, s1);
    });
    it('should sometimes throw an exception', function(){
        assert.throws(function(){
                cryptoe.messageFromHexString("12345"); // wrong length
            })
    });
  });

  describe('append and take', function(){
    it('should be complementary', function(){
        var m = cryptoe.messageFromHexString('ffee0011');
        var a = cryptoe.messageFromHexString('1278fa');
        
        m.appendMessage(a);
        m.appendByte(198);
        m.appendInt16(16666);
        m.skip(4);
        assert.equal( m.takeMessage(3).toHexString(), a.toHexString());
        assert.equal( m.takeByte(), 198);
        m.appendUint16(7634);
        m.appendInt32(-246787634);
        assert.equal( m.takeInt16(), 16666);
        assert.equal( m.takeUint16(), 7634);
        m.appendUint32(246787634);
        assert.equal( m.takeInt32(), -246787634);
        assert.equal( m.takeUint32(), 246787634);
    });   

    it('should work for long time', function(){
        var m = cryptoe.emptyMessage();
        var i;
        var a;
        var M = 8000;
        for (i=0; i<M; ++i) {
            m.appendInt32(i*71);
            a = m.clone();
            a.appendInt32(0xffffffff);
            a.takeUint32();
        }
        assert.equal(m.len(), 4*M);
        for (i=0; i<M; ++i) {
            a = m.clone();
            a.appendInt32(0xffffffff);
            a.takeUint32();
            assert.equal( m.takeInt32(), i*71);
        }
        assert.equal(m.len(), 0);
    });

  });

  describe('appendInt and takeInt', function(){
    it('should encode/decode using big endian', function(){
        var m = cryptoe.emptyMessage();
        m.appendByte(0x5f);
        m.appendByte(0x7a);
        assert.equal(m.takeInt16(), 0x5f7a);

        m.appendByte(0x12);
        m.appendByte(0x7a);
        assert.equal(m.takeUint16(), 0x127a);

        m.appendByte(0x12);
        m.appendByte(0x7a);
        m.appendByte(0x8c);
        m.appendByte(0x9d);
        assert.equal(m.takeUint32(), 0x127a8c9d);

        m.appendByte(0x12);
        m.appendByte(0x7a);
        m.appendByte(0x8c);
        m.appendByte(0x9d);
        assert.equal(m.takeInt32(), 0x127a8c9d);

        m.appendUint16(0x1234);
        assert.equal(m.takeByte(), 0x12);
        assert.equal(m.takeByte(), 0x34);

        m.appendUint32(0x12345678);
        assert.equal(m.takeInt16(), 0x1234);
        assert.equal(m.takeInt16(), 0x5678);
    });
  });

  describe('take', function(){
    it('should sometimes throw an exception', function(){
        assert.throws(function(){
            cryptoe.emptyMessage.takeByte();
        });
        assert.throws(function(){
            cryptoe.emptyMessage.takeInt16();
        });
        assert.throws(function(){
            cryptoe.emptyMessage.takeInt32();
        });
        assert.throws(function(){
            cryptoe.emptyMessage.takeMessage(5);
        });
    });   
  });

  describe('different messages', function(){
    it('should not interfere', function() {
        var m0 = cryptoe.emptyMessage();
        m.appendInt32(12345);
        var m1 = m0.slice(0);
        m0.appendInt32(324);
        var s0 = m0.toHexString();
        m1.appendInt32(898789); // this should not change the value of m0
        assert.equal(s0, m0.toHexString());
        var s1 = m1.toHexString();
        m0.appendInt32(6713); // this should not change the value of m1
        assert.equal(s1, m1.toHexString());
    });
  });

})

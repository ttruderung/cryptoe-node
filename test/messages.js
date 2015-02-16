var ct = require('../cryptoe');
var assert = require("assert")

var m = ct.emptyMessage();

describe('Message', function(){
  describe('empty', function(){
    it('should return an empty message ', function(){
        var m = ct.emptyMessage();
        assert.equal( m.len(), 0 );
    })
  });

  describe('messageFromASCII', function(){
    it('should encode one byte per character and decode to the same string', function(){
        var m = ct.messageFromString('abc', 'ascii');
        assert( m.len() === 3  );
        var s = m.toString('ascii');
        assert( 'abc' === s );
    });
  });

  describe('messageFromUTF16', function(){
    it('should encode two byte per character and decode to the same string', function(){
        var m = ct.messageFromString('abć', 'utf16');
        assert.equal(6, m.len());
        var s = m.toString('utf16');
        assert.equal('abć', s);
    });
  });

  describe('messageFromHexString', function(){
    it('should produce a message of the appropriate length and decode to the same string', function(){
        var s0 = '10afbcfa89';
        var m = ct.messageFromHexString(s0);
        assert.equal(5, m.len());
        var s1 = m.toHexString();
        assert.equal(s0, s1);
    });
    it('should sometimes throw an exception', function(){
        assert.throws(function(){
                ct.messageFromHexString("12345"); // wrong length
            })
    });
  });

  describe('append and take', function(){
    it('should be complementary', function(){
        var m = ct.messageFromHexString('ffee0011');
        var a = ct.messageFromHexString('1278fa');
        
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

        m.appendInt16(-1);
        assert.equal( m.takeInt16(), -1);
        m.appendInt16(0xffff);
        assert.equal( m.takeInt16(), -1);
        m.appendUint16(0xffff);
        assert.equal( m.takeUint16(), 0xffff);

        m.appendInt32(-1);
        assert.equal( m.takeInt32(), -1);
        m.appendInt32(0xffffffff);
        assert.equal( m.takeInt32(), -1);
        m.appendUint32(0xffffffff);
        assert.equal( m.takeUint32(), 0xffffffff);
    });   
  });

  describe('take', function(){
    it('should sometimes throw an exception', function(){
        assert.throws(function(){
            ct.emptyMessage.takeByte();
        });
        assert.throws(function(){
            ct.emptyMessage.takeInt16();
        });
        assert.throws(function(){
            ct.emptyMessage.takeInt32();
        });
        assert.throws(function(){
            ct.emptyMessage.takeMessage(5);
        });
    });   
  });

  describe('different messages', function(){
    it('should not interfere', function() {
        var m0 = ct.emptyMessage();
        m.appendInt32(12345);
        var m1 = m0.slice(0); // m1 is a clone of m0
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

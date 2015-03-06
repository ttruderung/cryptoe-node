var cryptoe = require('../cryptoe');
var assert = require("assert")

describe('Message', function(){
  describe('empty', function(){
    it('returns an empty message ', function(){
        var m = cryptoe.emptyMessage();
        assert.equal( m.len(), 0 );
    })
  });

  describe('slice', function(){
    it('works as expected', function(){
       var m = cryptoe.messageFromHexString('00112233445566778899aabb'); 
       var a = m.slice(0,5);
       var b = m.slice(5);
       var c = m.slice(2,7);
       var d = m.slice(2,-3);
       assert.equal(a.toHexString(), '0011223344');
       assert.equal(b.toHexString(), '5566778899aabb');
       assert.equal(c.toHexString(), '2233445566');
       assert.equal(d.toHexString(), '22334455667788');
    });

  });

  describe('messageFromBytes', function(){
    it('works as expected', function(){
        var m = cryptoe.messageFromBytes([10,11,12]);
        assert( m.len() === 3 );
        assert( m.byteAt(0) === 10 );
        assert( m.byteAt(1) === 11 );
        assert( m.byteAt(2) === 12 );

        var arr = new Uint8Array(100);
        for (var i=0; i<arr.length; ++i ) { arr[i] = 71*i+5; }
        var m = cryptoe.messageFromBytes(arr);
        var b = m.toBytes();
        assert.equal(b.lenght, arr.lenght);
        for (i=0; i<arr.length; ++i ) { 
            assert.equal(b[i], arr[i]);
        }
    });
  });

  describe('messageFromString', function(){
    it('encodes one byte per one ASCII character and decodes to the same string', function(){
        var m = cryptoe.messageFromString('abc');
        assert( m.len() === 3  );
        var s = m.toString();
        assert.equal('abc', s);
    });

    it('handles non-ascii characters', function(){
        var m = cryptoe.messageFromString('łąka!');
        assert.equal(m.toHexString(), 'c582c4856b6121');
        assert.equal(m.toString(), 'łąka!');
        m = cryptoe.messageFromString('わかよたれそつねならむ');
        assert.equal(m.toString(), 'わかよたれそつねならむ');
    });

  });

  describe('messageFromBase64 and toBase64', function(){
    it('works as expected', function(){
        var a,b;
        a = cryptoe.emptyMessage();
        b = cryptoe.messageFromBase64(a.toBase64());
        assert.equal(a.toHexString(), b.toHexString());

        a = cryptoe.messageFromBytes([12]);
        b = cryptoe.messageFromBase64(a.toBase64());
        assert.equal(a.toHexString(), b.toHexString());

        a = cryptoe.messageFromBytes([12,34,89,23,22,254]);
        b = cryptoe.messageFromBase64(a.toBase64());
        assert.equal(a.toHexString(), b.toHexString());
    });
  });


  describe('messageFromHexString', function(){
    it('produces a message of the appropriate length and decodes to the same string', function(){
        var s0 = '10afbcfa89';
        var m = cryptoe.messageFromHexString(s0);
        assert.equal(5, m.len());
        var s1 = m.toHexString();
        assert.equal(s0, s1);
    });
    it('should sometimes throw an exception', function(){
        assert.throws(function(err){
                cryptoe.messageFromHexString("12345"); // wrong length
            }, cryptoe.Error);
    });
  });

  describe('methods of message', function(){
    it('check types of their parameters', function(){
        var m = cryptoe.messageFromHexString('00112233445566778899aabb'); 

        assert.throws(function(){
           m.slice(2,"lkj");
        }, cryptoe.Error);
        assert.throws(function(){
           m.slice(2,"lkj");
        }, cryptoe.Error);
        assert.throws(function(){
           m.slice(2,{});
        }, cryptoe.Error);
        assert.throws(function(){
           m.slice({},3);
        }, cryptoe.Error);
  
        assert.throws(function(){
           m.takeMessage("kj");
        }, cryptoe.Error);
        assert.throws(function(){
           m.skip("kj");
        }, cryptoe.Error);

        assert.throws(function(){
           m.appendMessage({});
        }, cryptoe.Error);
        assert.throws(function(){
           m.appendBytes({});
        }, cryptoe.Error);

        assert.throws(function(){
           m.appendByte({});
        }, cryptoe.Error);
        assert.throws(function(){
           m.appendInt16("abc");
        }, cryptoe.Error);
        assert.throws(function(){
           m.appendInt32("abc");
        }, cryptoe.Error);

    })
  });

  describe('constructors of message', function(){
    it('check types of their parameters', function(){
        assert.throws(function(){
           cryptoe.messageFromBytes("abc");
        }, cryptoe.Error);
        assert.throws(function(){
           cryptoe.messageFromString(2);
        }, cryptoe.Error);
        assert.throws(function(){
           cryptoe.messageFromHexString(2);
        }, cryptoe.Error);
        assert.throws(function(){
           cryptoe.messageFromHexString("abc");
        }, cryptoe.Error);
        assert.throws(function(){
           cryptoe.messageFromHexString("am");
        }, cryptoe.Error);
        assert.throws(function(){
           cryptoe.messageFromBase64(5);
        }, cryptoe.Error);
    });
  });

  describe('append and take', function(){
    it('are complementary', function(){
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

        m.appendInt16(-1);
        assert.equal( m.takeInt16(), -1);
        m.appendInt16(0x7fff);
        assert.equal( m.takeInt16(), 0x7fff);
        m.appendUint16(0xffff);
        assert.equal( m.takeUint16(), 0xffff);

        m.appendInt32(-1);
        assert.equal( m.takeInt32(), -1);
        m.appendInt32(0x7fffffff);
        assert.equal( m.takeInt32(), 0x7fffffff);
        m.appendUint32(0xffffffff);
        assert.equal( m.takeUint32(), 0xffffffff);

        m.appendBytes([33,44,55]);
        assert.equal( m.takeByte(), 33 );
        assert.equal( m.takeByte(), 44 );
        assert.equal( m.takeByte(), 55 );
    });   

    it('work for long time', function(){
        var m = cryptoe.emptyMessage();
        var i;
        var a;
        var M = 8000;
        for (i=0; i<M; ++i) {
            m.appendInt32(i*71);
            a = m.clone();
            a.appendInt32(0x7fffffff);
            a.takeUint32();
        }
        assert.equal(m.len(), 4*M);
        for (i=0; i<M; ++i) {
            a = m.clone();
            a.appendInt32(0x7fffffff);
            a.takeUint32();
            assert.equal( m.takeInt32(), i*71);
        }
        assert.equal(m.len(), 0);
    });

  });

  describe('appendInt and takeInt', function(){
    it('encode/decode using big endian', function(){
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
    it('sometimes throws an exception', function(){
        assert.throws(function(){
            cryptoe.emptyMessage().takeByte();
        }, cryptoe.Error);
        assert.throws(function(){
            cryptoe.emptyMessage().takeInt16();
        }, cryptoe.Error);
        assert.throws(function(){
            cryptoe.emptyMessage().takeInt32();
        }, cryptoe.Error);
        assert.throws(function(){
            cryptoe.emptyMessage().takeMessage(5);
        }, cryptoe.Error);
    });   
  });

  describe('different messages', function(){
    it('should not interfere', function() {
        var m0 = cryptoe.emptyMessage();
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


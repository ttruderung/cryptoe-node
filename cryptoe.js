/**
 * Node.js implementation of cryptoe, a high-level crypto library
 * providing easy interoperability between client- and server-side
 * environments.
 *
 * @author Tomasz Truderung
 *
 * Copyright (c) 2015 Tomasz Truderung
 */

//////////////////////////////////////////////////////////////////////

/**
 * Private constructor of messages. It creates a messaage by encapsulating
 * by encapsulating an array of bytes (of type Uint8Array). 
 *
 * @param bytes: (Uint8Array) array of bytes 
 *
 * @param owner: (boolean) specifies if the created message owns the 
 *               byte array given as the first parameter. If yes, the
 *               message can change the values store in bytes, otherwise
 *               it has to re-allocate before making any changes.
 *
 * @return a new message object encapsulating 'bytes'
 */
function messageFromBytes(bytes, owner) {
    // Variable 'bytes' (Uint8Array) and 'owner' (boolean) represent the
    // internal state of the created message.  
    // Relevant fields of 'bytes': 
    //   data.byteOffset
    //   data.byteLength === data.length

    // The message object to be returned. All the public methods are
    // added to this object
    var message = {};

    // PUBLIC METHODS OF THE MESSAGE OBJECT

    /**
     * Returns the length of the message.
     */
    message.len = function() { return bytes.length; }

    /**
     * Returns the i-th byte of the message
     */
    message.byteAt = function(n) {
        return bytes[n];
    }

    /**
     * Returns a slice [begin,end) of the message. If end is unspecified,
     * message.length() is takes as its default value. The argument end
     * can also have negative values, in which case it is relative to the
     * end of the underlying buffer.
     *
     * This operation does not involve copying any data.
     */
    message.slice = function(begin, end) {
        if (end===undefined) { end = message.len(); }
        if (end<0) { end = message.len() + end; }
        return messageFromBytes(bytes.subarray(begin, end), false);
    }

    /**
     *  Returns the content of the message as an array of bytes
     *  (Uint8Array). The returned array is a copy of the message
     *  representation.
     */
    message.toBytes = function() {
        var array = new Uint8Array(message.len()); // create a new array
        array.set(bytes); // and copy the content of bytes to this array
        return array
    }

    /**
     * Returns a string with the hexadecimal representation of the
     * message.
     */
    message.toHexString = function() {
        var hex = "";
        for (var b of bytes) {
            if (b<16) hex += '0';
            hex += b.toString(16);
        }
        return hex;
    }

    /** 
     * Assumes that the message encodes a string and converts it back to a
     * string. 
     *
     * @parameter encoding: (string) can be "ascii" of "utf16". Depending
     * on the value of this parameter, the message is assumed to contain
     * ascii (one byte per character) or utf16 (two bytes per character)
     * encoded string. 
     */
    message.toString = function(encoding) {
        var str = "";       
        var arr;

        switch (encoding) {
        case 'ascii':
        case 'ASCII':
            for (var b of bytes) {
                str += String.fromCharCode(b);
            }
            break;
        case 'utf16':
        case 'utf-16':
        case 'UTF16':
        case 'UTF-16':
            arr = new Uint16Array(bytes.buffer, bytes.byteOffset, bytes.byteLenght);
            for (var c of arr) {
                str += String.fromCharCode(c);
            }
            break;
        default:
            throw new Error('Message.toString: unknown encoding');
        }
        return str;
    }

    // The following methods read some data from the beginning of
    // the message and move the message forward

    /**
     * Takes a 1-byte signed integer from the beginning of the message,
     * and moves the beginning of the message 1 byte forward.
     */
    message.getInt8 = function () {
        if (message.len()<1) throw new Error("Message: Out of range");
        var value = new DataView(bytes.buffer, bytes.byteOffset).getInt8(0);
        skip(1)
        return value;
    }

    /**
     * Takes a 2-byte signed integer from the beginning of the message,
     * and moves the beginning of the message 2 byte forward.
     */
    message.getInt16 = function () {
        if (message.len()<2) throw new Error("Message: Out of range");
        var value = new DataView(bytes.buffer, bytes.byteOffset).getInt16(0);
        skip(2)
        return value;
    }

    /**
     * Takes a 4-byte signed integer from the beginning of the message,
     * and moves the beginning of the message 4 byte forward.
     */
    message.getInt32 = function () {
        if (message.len()<4) throw new Error("Message: Out of range");
        var value = new DataView(bytes.buffer, bytes.byteOffset).getInt32(0);
        skip(4)
        return value;
    }

    /**
     * Takes a 1-byte unsigned integer from the beginning of the message,
     * and moves the beginning of the message 1 byte forward.
     */
    message.getUint8 = function () {
        if (message.len()<1) throw new Error("Message: Out of range");
        var value = new DataView(bytes.buffer, bytes.byteOffset).getUint8(0);
        skip(1)
        return value;
    }

    /**
     * Takes a 2-byte unsigned integer from the beginning of the message,
     * and moves the beginning of the message 2 byte forward.
     */
    message.getUint16 = function () {
        if (message.len()<2) throw new Error("Message: Out of range");
        var value = new DataView(bytes.buffer, bytes.byteOffset).getUint16(0);
        skip(2)
        return value;
    }

    /**
     * Takes a 4-byte unsigned integer from the beginning of the message,
     * and moves the beginning of the message 4 byte forward.
     */
    message.getUint32 = function () {
        if (message.len()<4) throw new Error("Message: Out of range");
        var value = new DataView(bytes.buffer, bytes.byteOffset).getUint32(0);
        skip(4)
        return value;
    }

    /**
     * Takes len bytes from the beginning of the messages and returns is
     * as a new message.
     */
    message.getMessage = function (len) {
        if (message.len()<len) throw new Error("Message: Out of range");
        var value = message.slice(0,len);
        skip(len);
        return value;
    }

    /**
     * Appends a message msg to this message. Does a reallocation, if
     * necessary.
     */
    message.append = function( msg ) {
        var l = msg.len();
        var end = message.len();
        ensureSpace(l); 
        for (var i=0; i<l; ++i) {
            bytes[end++] = msg.byteAt(i);
        }
    }

    message.stat = function() {
        console.log(' Status (offset/len/buffer-len):', bytes.byteOffset, bytes.length, bytes.buffer.byteLength);
    }

    // PRIVATE METHODS

    // Skips the first n bytes of the message (modifies the object)
    function skip(n) {
        if (bytes.byteLenght-n < 0) n = bytes.byteLenght;
        bytes = bytes.subarray(n); 
    }

    // Reallocate the byte array to a buffer of size newBufferSize and set
    // the initial size of the array to newArraySize.
    //
    function reallocate(newBufferSize, newArraySize) {
        if (newArraySize < message.len() || newBufferSize < newArraySize ) {
            throw new Error('Message.realocate: wrong size');
        }

        // Allocate a new buffer of size newBufferSize: 
        var newBuffer = new ArrayBuffer(newBufferSize);
        // Create the new array of bytes using elements of buffer from 0 to newArraySize
        var newBytes = new Uint8Array(newBuffer, 0, newArraySize); 
        // Copy existing data from the old array (bytes) to new array (newBytes):
        newBytes.set(bytes);
        // Substitute the new array by the new one:
        bytes = newBytes;
    }

    // Ensures enough space for additional numberOfNewBytes bytes.
    // If necessary, reallocates the data. Always resizes the byte array 'bytes'.
    function ensureSpace(numberOfNewBytes) {
        var newSize = message.len() + numberOfNewBytes;  // new requested size
        if (!owner ||  // always reallocate if this object does not own the byte array
            bytes.buffer.byteLength < bytes.byteOffset + newSize) // or if there is not enough space
        { 
            console.log(' * RE-ALLOCATING!')
            // new size of the buffer (twice as much as we need now)
            var newBufferSize = (message.len() + numberOfNewBytes)*2;
            reallocate(newBufferSize, newSize);
        }
        else { // no need for reallocation of the underlying buffer
            console.log(' * just resising')
            // it is enought to resize the byte array:
            bytes = new Uint8Array(bytes.buffer, bytes.byteOffset, newSize);
        }
    }

    // Return the message object
    return message;
}
// END OF MESSAGE


function messageFromArrayBuffer(buf, owner) {
    return messageFromBytes(new Uint8Array(buf), owner);
}

// Assumes that str is an ASCII string and returns the message
// creates out of it
function messageFromASCII(str) {
    var arr = new Uint8Array(str.length);
    for (var i=0; i<str.length; ++i) {
        arr[i] = str.charCodeAt(i);
    }
    return messageFromBytes(arr, true);
}


// Returns a message create from an UTF-16 string
function messageFromUTF16(str) {
    var arr = new Uint16Array(str.length);
    for (var i=0; i<str.length; ++i) {
        arr[i] = str.charCodeAt(i);
    }
    return messageFromArrayBuffer(arr.buffer, true);
}

function messageFromHexString(str) {
    var len = str.length/2;
    if (Math.floor(len)!==len) throw new Error("Message: wrong length of the input string");
    var arr = new Uint8Array(len);
    for (var i=0; i<len; ++i) {
        arr[i] = parseInt(str[2*i], 16)*16 + parseInt(str[2*i+1], 16);
    }
    return messageFromBytes(arr, true);
}


//////////////////////////////////////////////////////////////////////


var b = messageFromHexString("ffee");

var m = messageFromHexString("112233");
console.log(m.toHexString());
m.stat();

m.append(b);
console.log(m.toHexString());
m.stat();

m.getInt16();
console.log(m.toHexString());
m.stat();

m.append(b);
console.log(m.toHexString());
m.stat();

m.append(b);
console.log(m.toHexString());
m.stat();

m.append(b);
console.log(m.toHexString());
m.stat();


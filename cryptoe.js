/**
 * Node.js implementation of cryptoe, a high-level crypto library
 * providing easy interoperability between client- and server-side
 * environments.
 *
 * This is the version of cryptoe for node.js
 *
 * @author Tomasz Truderung
 *
 * Copyright (c) 2015 Tomasz Truderung
 */

cryptoe = exports;


//////////////////////////////////////////////////////////////////////
// MESSAGE


/**
 * Private constructor of messages. It creates a messaage  by
 * encapsulating an array of bytes (of type Uint8Array). 
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
function newMessage(bytes, owner) {
    // Variables bytes (Uint8Array) and owner (boolean) represent the
    // internal state of the created message. 


    // The message object to be returned. All the public methods are
    // added to this object
    var message = {};

    message.reallocationCounter = 0; // for testing 
    
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
     * Slicing is a light-weight operation and does not involve data
     * copying (the underlying data will be, however, copied once one of
     * the append method is called for the returned message).
     */
    message.slice = function(begin, end) {
        if (end===undefined) { end = message.len(); }
        if (end<0) { end = message.len() + end; }
        return newMessage(bytes.subarray(begin, end), false);
    }

    /**
     * Clones the message. It is a shortcut for slice(0).
     */
    message.clone = function() {
        return message.slice(0);
    }

    /**
     *  Returns the message as an array of bytes (Uint8Array). The
     *  returned array is a copy of the message representation.
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
     * Returns the base64 representation of the message.
     */
    message.toBase64 = function() {
        // Obtain a string, where every character represents one byte.
        var binstr = String.fromCharCode.apply(null, bytes);
        // Convert it to base54:
        return btoa(binstr);
    }

    /** 
     * Assumes that the message contains a utf-8 encoded string and
     * converts it back to a (native javascript) string. 
     */
    message.toString = function() {
        // Obtain a string, where every character represents one byte.
        var utf8str = String.fromCharCode.apply(null, bytes);
        return decodeURIComponent(escape(utf8str));
    }


    // The following methods read some data from the beginning of
    // the message and move the message forward

    /**
     * Takes a 1-byte signed integer from the beginning of the message,
     * and moves the beginning of the message 1 byte forward.
     */
    message.takeByte = function() {
        if (message.len()<1) throw new Error("Message.takeByte: not enought data");
        var value = message.byteAt(0);
        message.skip(1);
        return value;
    }

    /**
     * Takes a 2-byte signed integer from the beginning of the message,
     * and moves the beginning of the message 2 byte forward.
     */
    message.takeInt16 = function() {
        if (message.len()<2) throw new Error("Message.takeInt16: not enought data");
        var value = new DataView(bytes.buffer, bytes.byteOffset).getInt16(0);
        message.skip(2)
        return value;
    }

    /**
     * Takes a 4-byte signed integer from the beginning of the message,
     * and moves the beginning of the message 4 byte forward.
     */
    message.takeInt32 = function() {
        if (message.len()<4) throw new Error("Message.takeInt32: not enought data");
        var value = new DataView(bytes.buffer, bytes.byteOffset).getInt32(0);
        message.skip(4);
        return value;
    }

    /**
     * Takes a 2-byte unsigned integer from the beginning of the message,
     * and moves the beginning of the message 2 byte forward.
     */
    message.takeUint16 = function() {
        if (message.len()<2) throw new Error("Message.takeUInt16: not enought data");
        var value = new DataView(bytes.buffer, bytes.byteOffset).getUint16(0);
        message.skip(2);
        return value;
    }

    /**
     * Takes a 4-byte unsigned integer from the beginning of the message,
     * and moves the beginning of the message 4 byte forward.
     */
    message.takeUint32 = function() {
        if (message.len()<4) throw new Error("Message.takeUint32: not enought data");
        var value = new DataView(bytes.buffer, bytes.byteOffset).getUint32(0);
        message.skip(4);
        return value;
    }

    /**
     * Takes len bytes from the beginning of the messages and returns is
     * as a new message.
     */
    message.takeMessage = function(len) {
        if (message.len()<len) throw new Error("Message.takeMessage: not enought data");
        var value = message.slice(0,len);
        message.skip(len);
        return value;
    }

    /**
     * Skips n bytes (moves the beginning of the messages n bytes forward).
     */
    message.skip = function(n) {
        if (bytes.byteLenght-n < 0) n = bytes.byteLenght;
        bytes = bytes.subarray(n); 
    }


    /**
     * Appends a message msg to this message (does a reallocation, if
     * necessary).
     */
    message.appendMessage = function(msg) {
        var end = message.len(); // keep the end, the next line will change it
        var l = msg.len();
        enlargeBy(l); 
        for (var i=0; i<l; ++i) {
            bytes[end++] = msg.byteAt(i);
        }
    }

    /**
     * Appends a byte (unsigned 8-bit integer).
     */
    message.appendByte = function(b) {
        var end = message.len();
        enlargeBy(1); 
        bytes[end] = b;
    }

    /**
     * Appends a signed 16-bit integer.
     */
    message.appendInt16 = function(value) {
        var end = message.len();
        enlargeBy(2); 
        new DataView(bytes.buffer, bytes.byteOffset).setInt16(end, value);
    }

    message.appendUint16 = message.appendInt16;

    /**
     * Appends a signed 16-bit integer.
     */
    message.appendInt32 = function(value) {
        var end = message.len();
        enlargeBy(4); 
        new DataView(bytes.buffer, bytes.byteOffset).setInt32(end, value)
    }

    message.appendUint32 = message.appendInt32;


    // PRIVATE METHODS

    // Reallocate the byte array to a buffer of size newBufferSize and set
    // the initial size of the array to newArraySize (the array uses
    // part of the buffer; the buffer provides the underlying data).
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
        newBytes.set(bytes); // message.len() bytes is copied
        // Substitute the old array by the new one:
        bytes = newBytes;

        owner = true; // now we own the data
        message.reallocationCounter++;
    }

    // Enlarges the byte array 'bytes' by numberOfNewBytes bytes.
    // If necessary, reallocates the data. Always resizes the byte array 'bytes'.
    //
    function enlargeBy(numberOfNewBytes) {
        var newSize = message.len() + numberOfNewBytes;  // new requested size
        if (!owner ||  // always reallocate if this object does not own the byte array
            bytes.buffer.byteLength < bytes.byteOffset + newSize) // or if there is not enough space
        { 
            // Reallocate:
            var newBufferSize = (message.len() + numberOfNewBytes)*2; // twice as much as we need right now
            reallocate(newBufferSize, newSize);
        }
        else { 
            // Resize the array only:
            bytes = new Uint8Array(bytes.buffer, bytes.byteOffset, newSize);
        }
    }


    // Return the message object
    return message;
}
// END OF MESSAGE


/**
 * Creates a new emtpy message.
 */
cryptoe.emptyMessage = function () {
    // We assume that an empty message is created in order to
    // append some data to it. So we set the initial capacity to
    // some non-zero value
    var initialCapacity = 256;
    var buf = new ArrayBuffer(256);
    var bytes = new Uint8Array(buf, 0, 0);
    return newMessage(bytes, true);
}

/**
 * Creates a message from an array of bytes. It accepts anything that
 * has the property bytes.length and can be indexed by bytes[i].
 */
cryptoe.messageFromBytes = function(bytes) {
    var len = bytes.length;
    var arr = new Uint8Array(len);
    for (var i=0; i<len; ++i) {
        arr[i] = bytes[i];
    }
    return newMessage(arr, true);
}

/**
 * Creates a message from a string (in the native javascript encoding). 
 * The returned message is utf-8 encoded.
 */
cryptoe.messageFromString = function (str) {
    var binstr = unescape(encodeURIComponent(str)); // each character of utf8str represents one byte
    return messageFromBinString(binstr);
}

/**
 * Returns a message created from a hex-encoded string.
 */
cryptoe.messageFromHexString = function(str) {
    var len = str.length/2;
    if (Math.floor(len)!==len) throw new Error("Message: wrong length of the input string");
    var arr = new Uint8Array(len);
    for (var i=0; i<len; ++i) {
        arr[i] = parseInt(str[2*i], 16)*16 + parseInt(str[2*i+1], 16);
    }
    return newMessage(arr, true);
}

/**
 * Creates a message from a base64 representation.
 */
cryptoe.messageFromBase64 = function(base64str) {
    var binstr = atob(base64str); // each character of binstr represents one byte
    return messageFromBinString(binstr);
}

// PRIVATE FUNCTIONS

function messageFromBinString(binstr) {
    var len = binstr.length;
    var arr = new Uint8Array(len);
    for (var i=0; i<len; ++i) {
        arr[i] = binstr.charCodeAt(i);
    }
    return newMessage(arr, true);
}

/** 
 * Converts a binary string (one character per byte) to base64.
 */
function btoa(binstr) {
    return (new Buffer(binstr, 'binary')).toString('base64');
}

/** 
 * Converts a base64 string to a binary string (one character per byte)
 */
function atob(binstr) {
    return (new Buffer(binstr, 'base64')).toString('binary');
}

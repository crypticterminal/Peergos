if (typeof module !== "undefined")
    var nacl = require("./nacl");

// API for the User interface to use
/////////////////////////////

/////////////////////////////
// UserPublicKey methods
function UserPublicKey(publicSignKey, publicBoxKey) {
    this.pSignKey = publicSignKey; // 32 bytes
    this.pBoxKey = publicBoxKey; // 32 bytes

    // ((err, publicKeyString) -> ())
    this.getPublicKeys = function() {
        var tmp = new Uint8Array(this.pSignKey.length + this.pBoxKey.length);
        tmp.set(this.pSignKey, 0);
        tmp.set(this.pBoxKey, this.pSignKey.length);
        return tmp;
    }
    
    // (Uint8Array, User, (nonce, cipher) -> ())
    this.encryptMessageFor = function(input, us) {
        var nonce = createNonce();
        return concat(nacl.box(input, nonce, this.pBoxKey, us.sBoxKey), nonce);
    }
    
    // Uint8Array => boolean
    this.unsignMessage = function(sig) {
        return nacl.sign.open(sig, this.pSignKey);
    }
}

UserPublicKey.fromPublicKeys = function(both) {
    var pSign = slice(both, 0, 32);
    var pBox = slice(both, 32, 64);
    return new UserPublicKey(pSign, pBox);
}

UserPublicKey.HASH_BYTES = 32;
// Uint8Array => Uint8Array
UserPublicKey.hash = function(arr) {
    return sha256(arr);
}

function createNonce(){
    return window.nacl.randomBytes(24);
}

/////////////////////////////
// User methods
// (string, string, (User -> ())
function generateKeyPairs(username, password, cb) {
    var hash = UserPublicKey.hash(nacl.util.decodeUTF8(password));
    var salt = nacl.util.decodeUTF8(username)
    
    return new Promise(function(resolve, reject) {
        scrypt(hash, salt, 17, 8, 64, 1000, function(keyBytes) {
            var bothBytes = nacl.util.decodeBase64(keyBytes);
            var signBytes = bothBytes.subarray(0, 32);
            var boxBytes = bothBytes.subarray(32, 64);
            resolve(new User(nacl.sign.keyPair.fromSeed(signBytes), nacl.box.keyPair.fromSecretKey(new Uint8Array(boxBytes))));
        }, 'base64');
    });
}

function User(signKeyPair, boxKeyPair) {
    UserPublicKey.call(this, signKeyPair.publicKey, boxKeyPair.publicKey);
    this.sSignKey = signKeyPair.secretKey; // 64 bytes
    this.sBoxKey = boxKeyPair.secretKey; // 32 bytes
    
    // (Uint8Array, (nonce, sig) => ())
    this.hashAndSignMessage = function(input, cb) {
        signMessage(this.hash(input), cb);
    }
    
    // (Uint8Array, (nonce, sig) => ())
    this.signMessage = function(input) {
        return nacl.sign(input, this.sSignKey);
    }
    
    // (Uint8Array, (err, literals) -> ())
    this.decryptMessage = function(cipher, them) {
        var nonce = slice(cipher, cipher.length-24, cipher.length);
        cipher = slice(cipher, 0, cipher.length-24);
        return nacl.box.open(cipher, nonce, them.pBoxKey, this.sBoxKey);
    }

    this.getSecretKeys = function() {
        var tmp = new Uint8Array(this.sSignKey.length + this.sBoxKey.length);
        tmp.set(this.sSignKey, 0);
        tmp.set(this.sBoxKey, this.sSignKey.length);
        return tmp;
    }
}

User.fromEncodedKeys = function(publicKeys, secretKeys) {
    return new User(toKeyPair(slice(publicKeys, 0, 32), slice(secretKeys, 0, 64)), toKeyPair(slice(publicKeys, 32, 64), slice(secretKeys, 64, 96)));
}

User.fromSecretKeys = function(secretKeys) {
    var publicBoxKey = new Uint8Array(32);
    nacl.lowlevel.crypto_scalarmult_base(publicBoxKey, slice(secretKeys, 64, 96))
    return User.fromEncodedKeys(concat(slice(secretKeys, 32, 64), 
                publicBoxKey),
                secretKeys);
}

User.random = function() {
    var secretKeys = window.nacl.randomBytes(96);
    return User.fromSecretKeys(secretKeys);
}

function toKeyPair(pub, sec) {
    return {publicKey:pub, secretKey:sec};
}

/////////////////////////////
// SymmetricKey methods

function SymmetricKey(key) {
    this.key = key instanceof ByteBuffer ? new Uint8Array(key.toArray()) : key;

    // (Uint8Array, Uint8Array[24]) => Uint8Array
    this.encrypt = function(data, nonce) {
    return nacl.secretbox(data, nonce, this.key);
    }

    // (Uint8Array, Uint8Array) => Uint8Array
    this.decrypt = function(cipher, nonce) {
    return nacl.secretbox.open(cipher, nonce, this.key);
    }

    // () => Uint8Array
    this.createNonce = function() {
    return nacl.randomBytes(24);
}
}
SymmetricKey.NONCE_BYTES = 24;
SymmetricKey.random = function() {
    return new SymmetricKey(nacl.randomBytes(32));
}

function FileProperties(name, size) {
    this.name = name;
    this.size = size;

    this.serialize = function() {
        var buf = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
        buf.writeUnsignedInt(name.length);
        buf.writeString(name);
        buf.writeDouble(size);
        return new Uint8Array(buf.toArray());
    }

    this.getSize = function() {
        return size;
    }
}

FileProperties.deserialize = function(buf) {
    buf = new ByteBuffer(slice(buf, 0, buf.length));
    var nameBytes = buf.readArray();
    var size = buf.readDouble();
    return new FileProperties(nacl.util.encodeUTF8(nameBytes.toArray()), size);
}

function Fragment(data) {
    this.data = data;

    this.getHash = function() {
        return UserPublicKey.hash(data);
    }

    this.getData = function() {
        return data;
    }
}
Fragment.SIZE = 128*1024;

function EncryptedChunk(encrypted) {
    this.auth = slice(encrypted, 0, window.nacl.secretbox.overheadLength);
    this.cipher = slice(encrypted, window.nacl.secretbox.overheadLength, encrypted.length);

    this.generateFragments = function() {
        var bfrags = Erasure.split(this.cipher, EncryptedChunk.ERASURE_ORIGINAL, EncryptedChunk.ERASURE_ALLOWED_FAILURES);
        var frags = [];
        for (var i=0; i < bfrags.length; i++)
            frags[i] = new Fragment(bfrags[i]);
        return frags;
    }

    this.getAuth = function() {
        return this.auth;
    }

    this.decrypt = function(key, nonce) {
        return key.decrypt(concat(this.auth, this.cipher), nonce);
    }
}
EncryptedChunk.ERASURE_ORIGINAL = 40;
EncryptedChunk.ERASURE_ALLOWED_FAILURES = 10;

function Chunk(data, key) {
    this.data = data;
    this.key = key;
    this.nonce = window.nacl.randomBytes(SymmetricKey.NONCE_BYTES);
    this.mapKey = window.nacl.randomBytes(32);

    this.encrypt = function() {
        return new EncryptedChunk(key.encrypt(data, this.nonce));
    }
}
Chunk.MAX_SIZE = Fragment.SIZE*EncryptedChunk.ERASURE_ORIGINAL


function File(name, contents, key) {
    this.props = new FileProperties(name, contents.length);
    this.chunks = [];
    if (key == null) key = SymmetricKey.random();
    for (var i=0; i < contents.length; i+= Chunk.MAX_SIZE)
        this.chunks.push(new Chunk(slice(contents, i, Math.min(contents.length, i + Chunk.MAX_SIZE)), key));

    this.upload = function(context, owner, writer) {
        var proms = [];
        const chunk0 = this.chunks[0];
        const that = this;
        for (var i=0; i < this.chunks.length; i++)
            proms.push(new Promise(function(resolve, reject) {
                const chunk = that.chunks[i];
                const encryptedChunk = chunk.encrypt();
                const fragments = encryptedChunk.generateFragments();
                console.log("Uploading chunk with %d fragments\n", fragments.length);
                var hashes = [];
                for (var f in fragments)
                    hashes.push(new ByteBuffer(fragments[f].getHash()));
                const retriever = new EncryptedChunkRetriever(chunk.nonce, encryptedChunk.getAuth(), hashes, i+1 < that.chunks.length ? new Location(owner, writer, that.chunks[i+1].mapKey) : null);
                const metaBlob = FileAccess.create(chunk.key, that.props, retriever);
                resolve(context.uploadChunk(metaBlob, fragments, owner, writer, chunk.mapKey));
            }));
        return Promise.all(proms).then(function(res){
            return Promise.resolve(new Location(owner, writer, chunk0.mapKey));
        });
    }
}

/////////////////////////////
// Util methods

// byte[] input and return
function encryptBytesToBytes(input, pubKey) {
    return Java.to(encryptUint8ToUint8(input, pubKey), "byte[]");
}

// byte[] cipher and return
function decryptBytesToBytes(cipher, privKey) {
    return Java.to(decryptUint8ToUint8(cipher, privKey), "byte[]");
}

function uint8ArrayToByteArray(arr) {
    return Java.to(arr, "byte[]");
}

function slice(arr, start, end) {
    if (end < start)
        throw "negative slice size! "+start + " -> " + end;
    var r = new Uint8Array(end-start);
    if (arr instanceof ByteBuffer) {
        for (var i=start; i < end; i++)
            r[i-start] = arr.raw[i];
    } else {
        for (var i=start; i < end; i++)
            r[i-start] = arr[i];
    }
    return r;
}

function concat(a, b, c) {
    if (a instanceof Array) {
        var size = 0;
        for (var i=0; i < a.length; i++)
            size += a[i].length;
        var r = new Uint8Array(size);
        var index = 0;
        for (var i=0; i < a.length; i++)
            for (var j=0; j < a[i].length; j++)
                r[index++] = a[i].readUnsignedByte();
        return r;
    }
    var r = new Uint8Array(a.length+b.length+(c != null ? c.length : 0));
    for (var i=0; i < a.length; i++)
        r[i] = a[i];
    for (var i=0; i < b.length; i++)
        r[a.length+i] = b[i];
    if (c != null)
        for (var i=0; i < c.length; i++)
            r[a.length+b.length+i] = c[i];
    return r;
}

function arraysEqual(a, b) {
    if (a.length != b.length)
        return false;

    for (var i=0; i < a.length; i++)
        if (a[i] != b[i])
            return false;
    return true;
}

function get(path, onSuccess, onError) {

    var request = new XMLHttpRequest();
    request.open("GET", path);

    request.onreadystatechange=function()
    {
        if (request.readyState != 4)
            return;

        if (request.status == 200) 
            onSuccess(request.response);
        else
            onError(request.status);
    }

    request.send();
}

function getProm(url) {
    return new Promise(function(resolve, reject) {
    var req = new XMLHttpRequest();
    req.open('GET', url);

    req.onload = function() {
        // This is called even on 404 etc
        // so check the status
        if (req.status == 200) {
        resolve(req.response);
        }
        else {
        reject(Error(req.statusText));
        }
    };

    req.onerror = function() {
        reject(Error("Network Error"));
    };

    req.send();
    });
}

function post(path, data, onSuccess, onError) {

    var request = new XMLHttpRequest();
    request.open("POST" , path);
    request.responseType = 'arraybuffer';

    request.onreadystatechange=function()
    {
        if (request.readyState != 4)
            return;

        if (request.status == 200) 
            onSuccess(request.response);
        else
            onError(request.status);
    }

    request.send(data);
}

function postProm(url, data) {
    return new Promise(function(resolve, reject) {
    var req = new XMLHttpRequest();
    req.open('POST', url);
    req.responseType = 'arraybuffer';

    req.onload = function() {
        // This is called even on 404 etc
        // so check the status
        if (req.status == 200) {
        resolve(req.response);
        }
        else {
        reject(Error(req.statusText));
        }
    };

    req.onerror = function() {
        reject(Error("Network Error"));
    };

    req.send(data);
    });
}

//Java is Big-endian
function readInt(bytes, position) {
    var count = 0;
    for(var i = position; i <  position +4 ; i++)
        count = count << 8 + bytes[i];
    return count;
}

//Java is Big-endian
function writeInt(bytes, position, intValue) {
    intValue |= 0;
    for(var i = position + 3; position <= i ; i--)
        bytes[position] = intValue & 0xff;
        intValue >>= 8;
}

function DHTClient() {
    //
    //put
    //
    this.put = function(keyData, valueData, owner, sharingKeyData, mapKeyData, proofData) {
        var arrays = [keyData, valueData, owner, sharingKeyData, mapKeyData, proofData];
        var buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
        buffer.writeUnsignedInt(0); // PUT Message
        for (var iArray=0; iArray < arrays.length; iArray++) 
            buffer.writeArray(arrays[iArray]);
        return postProm("dht/put", new Uint8Array(buffer.toArray())).then(function(resBuf){
            var res = new ByteBuffer(resBuf).readUnsignedInt();
            if (res == 1) return Promise.resolve(true);
            return Promise.reject("Fragment upload failed");
        });
    };
    //
    //get
    //
    this.get = function(keyData) { 
        var buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
        buffer.writeUnsignedInt(1); // GET Message
        buffer.writeArray(keyData);
        return postProm("dht/get", new Uint8Array(buffer.toArray())).then(function(res) {
            var buf = new ByteBuffer(res);
            var success = buf.readUnsignedInt();
            if (success == 1)
                return Promise.resolve(buf.readArray());
            return Promise.reject("Fragment download failed");
        });
    };
    
    //
    //contains
    //
    this.contains = function(keyData) {
        var buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
        buffer.writeUnsignedInt(2); // CONTAINS Message
        buffer.writeArray(keyData);
        return postProm("dht/contains", new Uint8Array(buffer.toArray())); 
    };
}

function CoreNodeClient() {
    //String -> fn- >fn -> void
    this.getPublicKey = function(username) {
        var buffer = new  ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
        buffer.writeUnsignedInt(username.length);
        buffer.writeString(username);
        return postProm("core/getPublicKey", new Uint8Array(buffer.toArray()));
    };
    
    //UserPublicKey -> Uint8Array -> Uint8Array -> fn -> fn -> void
    this.updateStaticData = function(owner, signedStaticData) {
        var buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
        buffer.writeArray(owner.getPublicKeys());
        buffer.writeArray(signedStaticData);
        return postProm("core/updateStaticData", new Uint8Array(buffer.toArray())); 
    };
    
    //String -> fn- >fn -> void
    this.getStaticData = function(owner) {
        var buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
        buffer.writeArray(owner.getPublicKeys());
        return postProm("core/getStaticData", new Uint8Array(buffer.toArray()));
    };
    
    //Uint8Array -> fn -> fn -> void
    this.getUsername = function(publicKey) {
        var buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
        buffer.writeArray(publicKey);
        return postProm("core/getUsername", new Uint8Array(buffer.toArray())).then(function(res) {
            const rawName = new Uint8Array(new ByteBuffer(new Uint8Array(res)).readArray().toArray());
            return Promise.resolve(nacl.util.encodeUTF8(rawName));
        });
    };
    
    
    //String -> Uint8Array -> Uint8Array -> fn -> fn -> void
    this.addUsername = function(username, encodedUserKey, signed, staticData) {
        var buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
        buffer.writeUnsignedInt(username.length);
        buffer.writeString(username);
        buffer.writeArray(encodedUserKey);
        buffer.writeArray(signed);
        buffer.writeArray(staticData);
        return postProm("core/addUsername", new Uint8Array(buffer.toArray()));
    };
    
    //Uint8Array -> Uint8Array -> fn -> fn -> void
    this.followRequest = function( target,  encryptedPermission) {
        var buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
        buffer.writeArray(target);
        buffer.writeArray(encryptedPermission);
        return postProm("core/followRequest", new Uint8Array(buffer.toArray()));
    };
    
    //String -> Uint8Array -> fn -> fn -> void
    this.getFollowRequests = function( user) {
        var buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
        buffer.writeArray(user);
        return postProm("core/getFollowRequests", new Uint8Array(buffer.toArray())).then(function(res) {
            var buf = new ByteBuffer(res);
            var size = buf.readUnsignedInt();
            var n = buf.readUnsignedInt();
            var arr = [];
            for (var i=0; i < n; i++) {
                var t = buf.readArray();
                arr.push(new Uint8Array(t.toArray()));
            }
            return Promise.resolve(arr);
        });
    };
    
    //String -> Uint8Array -> Uint8Array -> fn -> fn -> void
    this.removeFollowRequest = function( target,  data,  signed) {
        var buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
        buffer.writeString(target);
        buffer.writeArray(data);
        buffer.writeArray(signed);
        return postProm("core/removeFollowRequest", new Uint8Array(buffer.toArray()));
    };

    //String -> Uint8Array -> Uint8Array -> fn -> fn -> void
    this.allowSharingKey = function(owner, signedWriter) {
        var buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
        buffer.writeArray(owner);
        buffer.writeArray(signedWriter); 
        return postProm("core/allowSharingKey", new Uint8Array(buffer.toArray()));
    };
    
    //String -> Uint8Array -> Uint8Array -> fn -> fn -> void
    this.banSharingKey = function(username,  encodedSharingPublicKey,  signedHash) {
        var buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
        buffer.writeString(username);
        buffer.writeArray(encodedSharingPublicKey);
        buffer.writeArray(signedHash); 
        return postProm("core/banSharingKey", new Uint8Array(buffer.toArray()));
    };

    //Uint8Array -> Uint8Array -> Uint8Array -> Uint8Array  -> Uint8Array -> fn -> fn -> void
    this.addMetadataBlob = function( owner,  encodedSharingPublicKey,  mapKey,  metadataBlob,  sharingKeySignedHash) {
        var buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
        buffer.writeArray(owner);
        buffer.writeArray(encodedSharingPublicKey);
        buffer.writeArray(mapKey);
        buffer.writeArray(metadataBlob);
        buffer.writeArray(sharingKeySignedHash);
        return postProm("core/addMetadataBlob", new Uint8Array(buffer.toArray())).then(function(res) {
            return Promise.resolve(new ByteBuffer(res).readByte() == 1);
        });
    };
    
    //String -> Uint8Array -> Uint8Array  -> Uint8Array -> fn -> fn -> void
    this.removeMetadataBlob = function( username,  encodedSharingKey,  mapKey,  sharingKeySignedMapKey) {
        var buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
        buffer.writeString(username);
        buffer.writeArray(encodedSharingKey);
        buffer.writeArray(mapKey);
        buffer.writeArray(sharingKeySignedMapKey);
        return postProm("core/removeMetadataBlob", new Uint8Array(buffer.toArray()));
    };

    //String  -> Uint8Array  -> Uint8Array -> fn -> fn -> void
    this.removeUsername = function( username,  userKey,  signedHash) {
        var buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
        buffer.writeString(username);
        buffer.writeArray(userKey);
        buffer.writeArray(signedHash);
        return post("core/removeUsername", new Uint8Array(buffer.toArray()));
    };

    //String -> fn -> fn -> void
    this.getSharingKeys = function( username) {
        var buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
        buffer.writeString(username);
        return postProm("core/getSharingKeys", new Uint8Array(buffer.toArray()));
    };
    
    //String  -> Uint8Array  -> fn -> fn -> void
    this.getMetadataBlob = function( owner,  encodedSharingKey,  mapKey) {
        var buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
        buffer.writeArray(owner.getPublicKeys());
        buffer.writeArray(encodedSharingKey.getPublicKeys());
        buffer.writeArray(mapKey);
        return postProm("core/getMetadataBlob", new Uint8Array(buffer.toArray()));
    };
    
    //String  -> Uint8Array  -> Uint8Array -> fn -> fn -> void
    this.isFragmentAllowed = function( owner,  encodedSharingKey,  mapkey,  hash) {
        var buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
        buffer.writeString(owner);
        buffer.writeArray(encodedSharingKey);
        buffer.writeArray(mapKey);
        buffer.writeArray(hash);
        return postProm("core/isFragmentAllowed", new Uint8Array(buffer.toArray()));
    };
    
    //String -> fn -> fn -> void
    this.getQuota = function(user) {
        var buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
        buffer.writeArray(user.getPublicKeys());
        return postProm("core/getQuota", new Uint8Array(buffer.toArray())).then(function(res) {
            var buf = new ByteBuffer(new Uint8Array(res));
            var quota = buf.readUnsignedInt() << 32;
            quota += buf.readUnsignedInt();
            return Promise.resolve(quota);
        });
    };
    
    //String -> fn -> fn -> void
    this.getUsage = function(username) {
        var buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
        buffer.writeString(username);
        return postProm("core/getUsage", new Uint8Array(buffer.toArray()));
    };
    
    //String  -> Uint8Array  -> Uint8Array -> fn -> fn -> void
    this.getFragmentHashes = function( username, sharingKey, mapKey) {
        var buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
        buffer.writeString(username);
        buffer.writeArray(sharingKey);
        buffer.writeArray(mapKey);
        return postProm("core/getFragmentHashes", new Uint8Array(buffer.toArray()));
    };

    //String  -> Uint8Array  -> Uint8Array -> Uint8Array -> [Uint8Array] -> Uint8Array -> fn -> fn -> void
    this.addFragmentHashes = function(username, encodedSharingPublicKey, mapKey, metadataBlob, allHashes, sharingKeySignedHash) {
        var buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
        buffer.writeString(username);
        buffer.writeArray(encodedShaaringPublicKey);
        buffer.writeArray(mapKey);
        buffer.writeArray(metadataBlob);

        buffer.writeInt(allHashes.length);
        for (var iHash=0; iHash  <  allHashes.length; iHash++) 
            buffer.writeArray(allHashes[iHash]);

        buffer.writeArray(sharingKeySignedHash);
        
        return postProm("core/addFragmentHashes", new Uint8Array(buffer.toArray()));
    };

    
    this.registerFragmentStorage = function(spaceDonor, address, port, owner, signedKeyPlusHash) {
        var buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
        buffer.writeArray(spaceDonor.getPublicKeys());
        buffer.writeArray(address);
        buffer.writeInt(port);
        buffer.writeArray(owner.getPublicKeys());
        buffer.writeArray(signedKeyPlusHash);
        return postProm("core/registerFragmentStorage", new Uint8Array(buffer.toArray()));
    };
};

function UserContext(username, user, dhtClient,  corenodeClient) {
    this.username  = username;
    this.user = user;
    this.dhtClient = dhtClient;
    this.corenodeClient = corenodeClient;
    this.staticData = []; // array of map entry pairs

    this.isRegistered = function() {
        return corenodeClient.getUsername(user.getPublicKeys()).then(function(res){
            return Promise.resolve(username == res);
        });
    }

    this.serializeStatic = function() {
        var buf = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
        buf.writeUnsignedInt(this.staticData.length);
        for (var i = 0; i < this.staticData.length; i++)
            buf.writeArray(this.staticData[i][1].serializeAndEncrypt(this.user, this.user));
        return buf.toArray();
    }

    this.register = function() {
        console.log("registering "+username);
        var rawStatic = this.serializeStatic();
        var signed = user.signMessage(concat(nacl.util.decodeUTF8(username), user.getPublicKeys(), rawStatic));
        return corenodeClient.addUsername(username, user.getPublicKeys(), signed, rawStatic)
    }

    this.createEntryDirectory = function(directoryName) {
        var writer = User.random();
        var rootMapKey = window.nacl.randomBytes(32); // root will be stored under this in the core node
        var rootRKey = SymmetricKey.random();

        // add a note to our static data so we know who we sent the private key to
        // and authorise the writer key
        const rootPointer = new ReadableFilePointer(this.user, writer, new ByteBuffer(rootMapKey), rootRKey);
        const entry = new EntryPoint(rootPointer, this.username, [], []);
        return this.addSharingKey(writer).then(function(res) {
            return this.addToStaticData(entry);
        }.bind(this)).then(function(res) {
            var root = DirAccess.create(writer, rootRKey, new FileProperties(directoryName, 0));
            return this.uploadChunk(root, [], this.user, writer, rootMapKey);
        }.bind(this));
    }

    this.sendFollowRequest = function(targetUser) {
        // create sharing keypair and give it write access
        var sharing = User.random();
        var rootMapKey = new ByteBuffer(window.nacl.randomBytes(32));

        // add a note to our static data so we know who we sent the private key to
        var friendRoot = new ReadableFilePointer(user, sharing, rootMapKey, SymmetricKey.random());
        return this.addSharingKey(sharing).then(function(res) {
            return this.corenodeClient.getUsername(targetUser.getPublicKeys()).then(function(name) {
                const entry = new EntryPoint(friendRoot, this.username, [], [name]);
                return this.addToStaticData(entry).then(function(res) {
                    // send details to allow friend to share with us (i.e. we follow them)

                    // create a tmp keypair whose public key we can append to the request without leaking information
                    var tmp = User.random();
                    var payload = entry.serializeAndEncrypt(tmp, targetUser);
                    return corenodeClient.followRequest(targetUser.getPublicKeys(), concat(tmp.pBoxKey, payload));
                });
            }.bind(this));
        }.bind(this));
    }.bind(this);

    this.addSharingKey = function(pub) {
        var signed = user.signMessage(pub.getPublicKeys());
        return corenodeClient.allowSharingKey(user.getPublicKeys(), signed);
    }

    this.addToStaticData = function(entry) {
        this.staticData.push([entry.pointer.writer, entry]);
        var rawStatic = new Uint8Array(this.serializeStatic());
        return corenodeClient.updateStaticData(user, user.signMessage(rawStatic));
    }

    this.getFollowRequests = function() {
        return corenodeClient.getFollowRequests(user.getPublicKeys());
    }

    this.decodeFollowRequest = function(raw) {
        var pBoxKey = new Uint8Array(32);
        for (var i=0; i < 32; i++)
            pBoxKey[i] = raw[i]; // signing key is not used
        var tmp = new UserPublicKey(null, pBoxKey);
        var buf = new ByteBuffer(raw);
        buf.read(32);
        var cipher = new Uint8Array(buf.read(raw.length - 32).toArray());
        return EntryPoint.decryptAndDeserialize(cipher, user, tmp);
    }
    
    this.uploadFragment = function(f, targetUser, sharer, mapKey) {
        return dhtClient.put(f.getHash(), f.getData(), targetUser.getPublicKeys(), sharer.getPublicKeys(), mapKey, sharer.signMessage(concat(sharer.getPublicKeys(), f.getHash())));
    }

    this.uploadChunk = function(metadata, fragments, owner, sharer, mapKey) {
        var buf = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
        metadata.serialize(buf);
        var metaBlob = buf.toArray();
        console.log("Storing metadata blob of " + metaBlob.length + " bytes.");
        return corenodeClient.addMetadataBlob(owner.getPublicKeys(), sharer.getPublicKeys(), mapKey, metaBlob, sharer.signMessage(concat(mapKey, metaBlob)))
        .then(function(added) {
            if (!added) {
                console.log("Meta blob store failed.");
            }
        }).then(function() {
            if (fragments.length == 0 )
                return Promise.resolve(true);

            // now upload fragments to DHT
            var futures = [];
            for (var i=0; i < fragments.length; i++)
                futures[i] = this.uploadFragment(fragments[i], owner, sharer, mapKey);

            // wait for all fragments to upload
            return Promise.all(futures);
        }.bind(this));
    }

    this.getRoots = function() {
        const context = this;
        return corenodeClient.getStaticData(user).then(function(raw) {
            var buf = new ByteBuffer(raw);
            var totalStaticLength = buf.readUnsignedInt();
            var count = buf.readUnsignedInt();
            var res = [];
            for (var i=0; i < count; i++) {
                var entry = EntryPoint.decryptAndDeserialize(buf.readArray(), context.user, context.user);
                res.push(entry);
            }
            // download the metadata blobs for these entry points
            var proms = [];
            for (var i=0; i < res.length; i++)
            proms[i] = corenodeClient.getMetadataBlob(res[i].pointer.owner, res[i].pointer.writer, res[i].pointer.mapKey);
            return Promise.all(proms).then(function(result) {
                var entryPoints = [];
                for (var i=0; i < result.length; i++) {
                    if (result[i].byteLength > 8) {
                        var unwrapped = new ByteBuffer(result[i]).readArray();
                        entryPoints.push([res[i], FileAccess.deserialize(new ByteBuffer(unwrapped))]);
                    } else
                        entryPoints.push([res[i], null]);
                }
                return Promise.resolve(entryPoints);
            });
        });
    }
// [SymmetricLocationLink], SymmetricKey
    this.retrieveAllMetadata = function(links, baseKey) {
        var proms = [];
        for (var i=0; i < links.length; i++) {
            var loc = links[i].targetLocation(baseKey);
            proms[i] = corenodeClient.getMetadataBlob(loc.owner, loc.writer, loc.mapKey);
        }
        return Promise.all(proms).then(function(rawBlobs) {
            var accesses = [];
            for (var i=0; i < rawBlobs.length; i++) {
                var unwrapped = new ByteBuffer(rawBlobs[i]).readArray();
                accesses[i] = [links[i], FileAccess.deserialize(new ByteBuffer(unwrapped))];
            }
            return Promise.resolve(accesses);
        });
    }

    this.getMetadata = function(loc) {
        return corenodeClient.getMetadataBlob(loc.owner, loc.writer, loc.mapKey).then(function(buf) {
            var unwrapped = new ByteBuffer(buf).readArray();
            return FileAccess.deserialize(new ByteBuffer(unwrapped));
        });
    }

    this.downloadFragments = function(hashes, nRequired) {
        var result = {}; 
        result.fragments = [];
        result.nError = 0;
        
        var proms = [];
        for (var i=0; i < hashes.length; i++)
            proms.push(dhtClient.get(hashes[i]).then(function(val) {
                result.fragments.push(val.toArray());
                console.log("Got Fragment.");
            }).catch(function() {
                result.nError++;
            }));

        return Promise.all(proms).then(function (all) {
            console.log("All done.");
            if (result.fragments.length < nRequired)
                throw "Not enough fragments!";
            return Promise.resolve(result.fragments);
        });
    }
}

function ReadableFilePointer(owner, writer, mapKey, baseKey) {
    this.owner = owner; //UserPublicKey
    this.writer = writer; //User / UserPublicKey
    this.mapKey = mapKey; //ByteArrayWrapper
    this.baseKey = baseKey; //SymmetricKey

    this.serialize = function() {
        var bout = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
        bout.writeArray(owner.getPublicKeys());
        if (writer instanceof User)
            bout.writeArray(writer.getSecretKeys());
        else
            bout.writeArray(writer.getPublicKeys());
        bout.writeArray(mapKey);
        bout.writeArray(baseKey.key);
        return new Uint8Array(bout.toArray());
    }

    this.isWritable = function() {
        return this.writer instanceof User;
    }
}

ReadableFilePointer.deserialize = function(arr) {
    const bin = new ByteBuffer(arr);
    const owner = bin.readArray();
    const writerRaw = bin.readArray();
    const mapKey = bin.readArray();
    const rootDirKeySecret = bin.readArray();
    const writer = writerRaw.length == window.nacl.box.secretKeyLength + window.nacl.sign.secretKeyLength ?
    User.fromSecretKeys(writerRaw) :
    UserPublicKey.fromPublicKeys(writerRaw);
    return new ReadableFilePointer(UserPublicKey.fromPublicKeys(owner), writer, mapKey, new SymmetricKey(rootDirKeySecret));
}

//ReadableFilePointer, FileAccess
function RetrievedFilePointer(pointer, access) {
    this.filePointer = pointer;
    this.fileAccess = access;
}

// ReadableFilePinter, String, [String], [String]
function EntryPoint(pointer, owner, readers, writers) {
    this.pointer = pointer;
    this.owner = owner;
    this.readers = readers;
    this.writers = writers;

    // User, UserPublicKey
    this.serializeAndEncrypt = function(user, target) {
        return target.encryptMessageFor(this.serialize(), user);
    }

    this.serialize = function() {
        const dout = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
        dout.writeArray(this.pointer.serialize());
        dout.writeUnsignedInt(this.owner.length);
        dout.writeString(this.owner);
        dout.writeUnsignedInt(this.readers.length);
        for (var i = 0; i < this.readers.length; i++) {
            dout.writeUnsignedInt(this.readers[i].length);
            dout.writetring(this.readers[i]);
        }
        dout.writeInt(this.writers.length);
        for (var i=0; i < this.writers.length; i++) {
            dout.writeUnsignedInt(this.writers[i].length);
            dout.writeString(this.writers[i]);
        }
        return new Uint8Array(dout.toArray());
    }
}

// byte[], User, UserPublicKey
EntryPoint.decryptAndDeserialize = function(input, user, from) {
    const raw = new Uint8Array(user.decryptMessage(input, from));
    const din = new ByteBuffer(raw);
    const pointer = ReadableFilePointer.deserialize(din.readArray());
    const owner = nacl.util.encodeUTF8(din.readArray().toArray());
    const nReaders = din.readInt();
    const readers = [];
    for (var i=0; i < nReaders; i++)
        readers.push(nacl.util.encodeUTF8(din.readArray().toArray()));
    const nWriters = din.readInt();
    const writers = [];
    for (var i=0; i < nWriters; i++)
        writers.push(nacl.util.encodeUTF8(din.readArray().toArray()));
    return new EntryPoint(pointer, owner, readers, writers);
}

function SymmetricLink(link) {
    this.link = slice(link, SymmetricKey.NONCE_BYTES, link.length);
    this.nonce = slice(link, 0, SymmetricKey.NONCE_BYTES);

    this.serialize = function() {
    return concat(this.nonce, this.link);
    }

    this.target = function(from) {
    var encoded = from.decrypt(this.link, this.nonce);
    return new SymmetricKey(encoded);
    }
}
SymmetricLink.fromPair = function(from, to, nonce) {
    return new SymmetricLink(concat(nonce, from.encrypt(to.key, nonce)));
}

// UserPublicKey, UserPublicKey, Uint8Array
function Location(owner, writer, mapKey) {
    this.owner = owner;
    this.writer = writer;
    this.mapKey = mapKey;

    this.serialize = function() {
        var bout = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
        bout.writeArray(owner.getPublicKeys());
        bout.writeArray(writer.getPublicKeys());
        bout.writeArray(mapKey);
        return new Uint8Array(bout.toArray());
    }

    this.encrypt = function(key, nonce) {
        return key.encrypt(this.serialize(), nonce);
    }
}
Location.deserialize = function(buf) {
    var owner = buf.readArray();
    var writer = buf.readArray();
    var mapKey = buf.readArray();
    return new Location(UserPublicKey.fromPublicKeys(owner), UserPublicKey.fromPublicKeys(writer), mapKey);
}
Location.decrypt = function(from, nonce, loc) {
    var raw = from.decrypt(loc, nonce);
    return Location.deserialize(new ByteBuffer(new Uint8Array(raw)));
}

function SymmetricLocationLink(arr) {
    const buf = new ByteBuffer(arr);
    this.link = buf.readArray();
    this.loc = buf.readArray();

    // SymmetricKey -> Location
    this.targetLocation = function(from) {
        var nonce = slice(this.link, 0, SymmetricKey.NONCE_BYTES);
        var rest = slice(this.link, SymmetricKey.NONCE_BYTES, this.link.length);
        return Location.decrypt(from, nonce, new Uint8Array(this.loc.toArray()));
    }

    this.target = function(from) {
        var nonce = slice(this.link, 0, SymmetricKey.NONCE_BYTES);
        var rest = slice(this.link, SymmetricKey.NONCE_BYTES, this.link.length);
        var encoded = from.decrypt(rest, nonce);
        return new SymmetricKey(encoded);
    }

    this.serialize = function() {
        var buf = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
        buf.writeArray(this.link);
        buf.writeArray(this.loc);
        return buf.toArray();
    }
}

function FileAccess(parent2meta, properties, retriever, parentLink) {
    this.parent2meta = parent2meta;
    this.properties = properties;
    this.retriever = retriever;
    this.parentLink = parentLink;

    this.serialize = function(bout) {
        bout.writeArray(parent2meta.serialize());
        bout.writeArray(properties);
        bout.writeByte(retriever != null ? 1 : 0);
        if (retriever != null)
            retriever.serialize(bout);
        bout.writeByte(parentLink != null ? 1: 0);
        if (parentLink != null)
            bout.writeArray(this.parentLink.serialize());
        bout.writeByte(this.getType());
    }

    // 0=FILE, 1=DIR
    this.getType = function() {
        return 0;
    }
    
    this.isDirectory =  function() {
            return this.getType() == 1;
    }
    this.getMetaKey = function(parentKey) {
        return parent2meta.target(parentKey);
    }

    this.getFileProperties = function(parentKey) {
        var nonce = slice(this.properties, 0, SymmetricKey.NONCE_BYTES);
        var cipher = slice(this.properties, SymmetricKey.NONCE_BYTES, this.properties.length);
        return FileProperties.deserialize(this.getMetaKey(parentKey).decrypt(cipher, nonce));
    }
}
FileAccess.deserialize = function(buf) {
    var p2m = buf.readArray();
    var properties = buf.readArray();
    var hasRetreiver = buf.readUnsignedByte();
    var retriever =  (hasRetreiver == 1) ? FileRetriever.deserialize(buf) : null;
    var hasParent = buf.readUnsignedByte();
    var parentLink =  (hasParent == 1) ? new SymmetricLocationLink(buf.readArray()) : null;
    var type = buf.readUnsignedByte();
    var fileAccess = new FileAccess(new SymmetricLink(p2m), properties, retriever, parentLink);
    switch(type) {
        case 0:
            return fileAccess;
        case 1:
            return DirAccess.deserialize(fileAccess, buf);
        default: throw new Error("Unknown Metadata type: "+type);
    }
}

FileAccess.create = function(parentKey, props, retriever) {
    var metaKey = SymmetricKey.random();
    var nonce = metaKey.createNonce();
    return new FileAccess(SymmetricLink.fromPair(parentKey, metaKey, parentKey.createNonce()),
                concat(nonce, metaKey.encrypt(props.serialize(), nonce)), retriever);
}

function DirAccess(subfolders2files, subfolders2parent, subfolders, files, parent2meta, properties, retriever) {
    FileAccess.call(this, parent2meta, properties, retriever);
    this.subfolders2files = subfolders2files;
    this.subfolders2parent = subfolders2parent;
    this.subfolders = subfolders;
    this.files = files;

    this.superSerialize = this.serialize;
    this.serialize = function(bout) {
        this.superSerialize(bout);
        bout.writeArray(subfolders2parent.serialize());
        bout.writeArray(subfolders2files.serialize());
        bout.writeUnsignedInt(0);
        bout.writeUnsignedInt(subfolders.length)
        for (var i=0; i < subfolders.length; i++)
            bout.writeArray(subfolders[i].serialize());
        bout.writeUnsignedInt(files.length)
        for (var i=0; i < files.length; i++)
            bout.writeArray(files[i].serialize());
    }

    // Location, SymmetricKey, SymmetricKey
    this.addFile = function(location, ourSubfolders, targetParent) {
        var nonce = ourSubfolders.createNonce();
        var loc = location.encrypt(ourSubfolders, nonce);
        var link = concat(nonce, ourSubfolders.encrypt(targetParent.key, nonce));
        var buf = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
        buf.writeArray(link);
        buf.writeArray(loc);
        this.files.push(new SymmetricLocationLink(new ByteBuffer(buf)));
    }

    // 0=FILE, 1=DIR
    this.getType = function() {
        return 1;
    }

    // returns [RetrievedFilePointer]
    this.getChildren = function(context, baseKey) {
        const prom1 = context.retrieveAllMetadata(this.subfolders, baseKey);
        const prom2 = context.retrieveAllMetadata(this.files, this.subfolders2files.target(baseKey));
        return Promise.all([prom1, prom2]).then(function(mapArr) {
            const res = mapArr[0];
            for (var i=0; i < mapArr[1].length; i++)
                res.push(mapArr[1][i]);
            const retrievedFilePointers = res.map(function(entry) {
               return new RetrievedFilePointer(entry[0],  entry[1]); 
            })
            return Promise.resolve(retrievedFilePointers);
        })
    }

    this.getParentKey = function(subfoldersKey) {
        return this.subfolders2parent.target(subfoldersKey);
    }

    this.getFilesKey = function(subfoldersKey) {
        return this.subfolders2files.target(subfoldersKey);
    }
}

DirAccess.deserialize = function(base, bin) {
    var s2p = bin.readArray().toArray();
    var s2f = bin.readArray().toArray();

    var nSharingKeys = bin.readUnsignedInt();
    var files = [], subfolders = [];
    var nsubfolders = bin.readUnsignedInt();
    for (var i=0; i < nsubfolders; i++)
        subfolders[i] = new SymmetricLocationLink(bin.readArray().toArray());
    var nfiles = bin.readUnsignedInt();
    for (var i=0; i < nfiles; i++)
        files[i] = new SymmetricLocationLink(bin.readArray().toArray());
    return new DirAccess(new SymmetricLink(s2f),
                         new SymmetricLink(s2p),
                         subfolders, files, base.parent2meta, base.properties, base.retriever);
}

// User, SymmetricKey, FileProperties
DirAccess.create = function(owner, subfoldersKey, metadata) {
    var metaKey = SymmetricKey.random();
    var parentKey = SymmetricKey.random();
    var filesKey = SymmetricKey.random();
    var metaNonce = metaKey.createNonce();
    return new DirAccess(SymmetricLink.fromPair(subfoldersKey, filesKey, subfoldersKey.createNonce()),
             SymmetricLink.fromPair(subfoldersKey, parentKey, subfoldersKey.createNonce()),
             [], [],
             SymmetricLink.fromPair(parentKey, metaKey, parentKey.createNonce()),
             concat(metaNonce, metaKey.encrypt(metadata.serialize(), metaNonce))
            );
}

function FileRetriever() {
}
FileRetriever.deserialize = function(bin) {
    var type = bin.readUnsignedByte();
    switch (type) {
    case 0:
    throw new Exception("Simple FileRetriever not implemented!");
    case 1:
    return EncryptedChunkRetriever.deserialize(bin);
    default:
    throw new Exception("Unknown FileRetriever type: "+type);
    }
}

function EncryptedChunkRetriever(chunkNonce, chunkAuth, fragmentHashes, nextChunk) {
    this.chunkNonce = chunkNonce;
    this.chunkAuth = chunkAuth;
    this.fragmentHashes = fragmentHashes;
    this.nextChunk = nextChunk;

    this.getFile = function(context, dataKey) {
        const stream = this;
        return this.getChunkInputStream(context, dataKey).then(function(chunk) {
            return Promise.resolve(new LazyInputStreamCombiner(stream, context, dataKey, chunk));
        });
    }

    this.getNext = function() {
        return nextChunk;
    }

    this.getChunkInputStream = function(context, dataKey) {
        var fragmentsProm = context.downloadFragments(fragmentHashes);
        return fragmentsProm.then(function(fragments) {
            fragments = Erasure.reorder(fragments, fragmentHashes);
            var cipherText = Erasure.recombine(fragments, Chunk.MAX_SIZE, EncryptedChunk.ERASURE_ORIGINAL, EncryptedChunk.ERASURE_ALLOWED_FAILURES);
            var fullEncryptedChunk = new EncryptedChunk(concat(chunkAuth, cipherText.toArray()));
            var original = fullEncryptedChunk.decrypt(dataKey, chunkNonce);
            return Promise.resolve(original);
        });
    }

    this.serialize = function(buf) {
        buf.writeUnsignedByte(1); // This class
        buf.writeArray(chunkNonce);
        buf.writeArray(chunkAuth);
        buf.writeArray(concat(fragmentHashes));
        buf.writeUnsignedByte(nextChunk != null ? 1 : 0);
        if (nextChunk != null)
            buf.write(nextChunk.serialize());
    }
}
EncryptedChunkRetriever.deserialize = function(buf) {
    var chunkNonce = new Uint8Array(buf.readArray().toArray());
    var chunkAuth = new Uint8Array(buf.readArray().toArray());
    var concatFragmentHashes = new Uint8Array(buf.readArray().toArray());
    var fragmentHashes = split(concatFragmentHashes, UserPublicKey.HASH_BYTES);
    var hasNext = buf.readUnsignedByte();
    var nextChunk = null;
    if (hasNext == 1)
        nextChunk = Location.deserialize(buf);
    return new EncryptedChunkRetriever(chunkNonce, chunkAuth, fragmentHashes, nextChunk);
}

function split(arr, size) {
    var length = arr.byteLength/size;
    var res = [];
    for (var i=0; i < length; i++)
    res[i] = slice(arr, i*size, (i+1)*size);
    return res;
}

function LazyInputStreamCombiner(stream, context, dataKey, chunk) {
    this.context = context;
    this.dataKey = dataKey;
    this.current = chunk;
    this.index = 0;
    this.next = stream.getNext();

    this.getNextStream = function() {
        if (this.next != null) {
            const lazy = this;
            return context.getMetadata(this.next).then(function(meta) {
                var nextRet = meta.retriever;
                lazy.next = nextRet.getNext();
                return nextRet.getChunkInputStream(context, dataKey);
            });
        }
        throw "EOFException";
    }

    this.bytesReady = function() {
        return this.current.length - this.index;
    }

    this.readByte = function() {
        try {
            return this.current[this.index++];
        } catch (e) {}
        const lazy = this;
        this.getNextStream().then(function(res){
            lazy.index = 0;
            lazy.current = res;
            return lazy.current.readByte();
        });
    }

    this.read = function(len, res, offset) {
        const lazy = this;
        if (res == null) {
            res = new Uint8Array(len);
            offset = 0;
        }
        const available = lazy.bytesReady();
        const toRead = Math.min(available, len);
        for (var i=0; i < toRead; i++)
            res[offset + i] = lazy.readByte();
        if (available >= len)
            return Promise.resolve(res);
        return this.getNextStream().then(function(chunk){
            lazy.index = 0;
            lazy.current = chunk;
            return lazy.read(len-toRead, res, offset + toRead);
        });
    }
}

var Erasure = {};
Erasure.recombine = function(fragments, truncateTo, originalBlobs, allowedFailures) {
    var buf = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
    // assume we have all fragments in original order for now
    for (var i=0; i < originalBlobs; i++)
    buf.write(fragments[i]);
    return buf;
}
Erasure.reorder = function(fragments, hashes) {
    var hashMap = new Map(); //ba dum che
    for (var i=0; i < hashes.length; i++)
        hashMap.set(nacl.util.encodeBase64(hashes[i]), i); // Seems Map can't handle array contents equality
    var res = [];
    for (var i=0; i < fragments.length; i++) {
        var hash = nacl.util.encodeBase64(UserPublicKey.hash(fragments[i]));
        var index = hashMap.get(hash);
        res[index] = fragments[i];
    }
    return res;
}
Erasure.split = function(input, originalBlobs, allowedFailures) {
    //TO DO port erasure code implementation and Galois groups
    var size = (input.length/originalBlobs)|0;
    var bfrags = [];
    for (var i=0; i < input.length/size; i++)
        bfrags.push(slice(input, i*size, Math.min(input.length, (i+1)*size)));
    return bfrags;
}

function string2arraybuffer(str) {
    var buf = new ArrayBuffer(str.length);
    var bufView = new Uint8Array(buf);
    for (var i=0, strLen=str.length; i<strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return bufView;
}


if (typeof module !== "undefined"){
    module.exports.randomSymmetricKey = randomSymmetricKey;
    module.exports.SymmetricKey = SymmetricKey;
}

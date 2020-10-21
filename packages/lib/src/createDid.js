const HDKey = require('hdkey');

module.exports = publicExtendedKey => {

    if(publicExtendedKey.indexOf("xpub") != 0)
    {
        console.log("Key '"+publicExtendedKey+"' not an extended public key.");
        throw new Error("Not an extended public key");
    }
    var key = HDKey.fromExtendedKey(publicExtendedKey.toString());
    var publicKey = key.publicKey;
    
    let b64 = Buffer.from(publicKey).toString('base64');
    b64 = b64.replace(/[+]/g, '-');
    b64 = b64.replace(/\//g,'_');
    b64 = b64.replace(/[=]+$/, '');
    return "did:dad:"+b64;

}
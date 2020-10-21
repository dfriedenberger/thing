const HDKey = require('hdkey');
const crypto = require('crypto');
const ecKeyUtils = require('eckey-utils');

const curveName = 'secp256k1';


module.exports = (document, privateExtendedKey)  => {

    //get public Key
    if(privateExtendedKey.indexOf("xprv") != 0)
    {
        console.log("Key '"+privateExtendedKey+"' not an extended private key.");
        return;
    }

    var key = HDKey.fromExtendedKey(privateExtendedKey.toString());

    let pems = ecKeyUtils.generatePem({
        curveName,
        privateKey: key.privateKey,
        publicKey: key.publicKey
    });


    //Sign
    let sign = crypto.createSign('SHA256')
    sign.update(document);
    let signBuffer = sign.sign(pems.privateKey);
    let signature = Buffer.from(signBuffer).toString('base64');

    return document + "\r\n\r\n" + signature;
}
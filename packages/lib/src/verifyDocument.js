const HDKey = require('hdkey');
const crypto = require('crypto');
const ecKeyUtils = require('eckey-utils');

const curveName = 'secp256k1';

module.exports = (document, signature, publicExtendedKey)  => {

      //get public Key
      if(publicExtendedKey.indexOf("xpub") != 0)
      {
          console.log("Key '"+publicExtendedKey+"' not an extended public key.");
          return false;
      }

      var key = HDKey.fromExtendedKey(publicExtendedKey.toString());

      let pems = ecKeyUtils.generatePem({
          curveName,
          publicKey: key.publicKey
      });


      let signBuffer = Buffer.from(signature,"base64");

      let verify = crypto.createVerify('SHA256');
      verify.update(document);
      return verify.verify(pems.publicKey, signBuffer);

}
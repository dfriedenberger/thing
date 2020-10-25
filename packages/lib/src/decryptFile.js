const crypto = require('crypto');
const fs = require('fs');
const {Base64Decode}  = require('base64-stream');

const curveName = 'secp256k1';

module.exports = (encryptedFile,decryptedFile,privateKey,publicKey,IV)  => {

    return new Promise(function(resolve,reject) {

        if(!fs.existsSync(encryptedFile))
        {
            console.log("File '"+encryptedFile+"' not exists.");
            reject();
        }

        if(fs.existsSync(decryptedFile))
        {
            console.log("Cannot create file '"+decryptedFile+"'. It already exists.");
            reject();
        }

        const ec = crypto.createECDH(curveName);
        ec.setPrivateKey(privateKey);

        //Create secret with Diffie Hellman
        var secret = ec.computeSecret(publicKey);

        // Encrypt file
        const ENC_KEY = Buffer.from(secret,'hex'); // set random encryption key, Buffer 32
    
        let decipher = crypto.createDecipheriv('aes-256-cbc', ENC_KEY, IV);
        const input = fs.createReadStream(encryptedFile); 
        const output = fs.createWriteStream(decryptedFile);


        input.pipe(new Base64Decode()).pipe(decipher).pipe(output).on("close",() => {
            resolve();
        });

    });

}
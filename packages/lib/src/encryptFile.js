const crypto = require('crypto');
const fs = require('fs');
const {Base64Encode}  = require('base64-stream');

const curveName = 'secp256k1';

module.exports = (file,encryptedFile,privateKey,publicKey,IV)  => {




    return new Promise(function(resolve,reject) {

        if(!fs.existsSync(file))
        {
            console.log("File '"+file+"' not exists.");
            reject();
        }

        if(fs.existsSync(encryptedFile))
        {
            console.log("Cannot create file '"+encryptedFile+"'. It already exists.");
            reject();
        }

        const ec = crypto.createECDH(curveName);
        ec.setPrivateKey(privateKey);

        //Create secret with Diffie Hellman
        var secret = ec.computeSecret(publicKey);

        // Encrypt file
        const ENC_KEY = Buffer.from(secret,'hex'); // set random encryption key, Buffer 32
    
        let cipher = crypto.createCipheriv('aes-256-cbc', ENC_KEY, IV);
        const input = fs.createReadStream(file); 
        const output = fs.createWriteStream(encryptedFile);


        input.pipe(cipher).pipe(new Base64Encode()).pipe(output).on("close",() => {
            resolve();
        });

    });

}
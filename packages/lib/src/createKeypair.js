
const HDKey = require('hdkey');
const crypto = require('crypto');
const fs = require('fs');

module.exports = folder => {
    
    if(!fs.existsSync(folder))
    {
        console.log("Folder '"+folder+"' must exist.");
        return false;
    }

    var xprvKeyFile = folder+"/key.xprv";
    var xpubKeyFile = folder+"/key.xpub";
    
    if(fs.existsSync(xprvKeyFile) || fs.existsSync(xpubKeyFile))
    {
        console.log("Cannot create key. It already exists.");
        return false;
    }


    console.log("Create keypair in folder '"+folder+"'");

        
    //create extended key pair 
    let seed = crypto.randomBytes(128);
    let hdkey = HDKey.fromMasterSeed(seed);
    console.log("public key:",hdkey.publicKey.toString('hex'));

    fs.writeFileSync(xprvKeyFile, hdkey.privateExtendedKey);
    fs.writeFileSync(xpubKeyFile, hdkey.publicExtendedKey);

    return true;
};
  
const HDKey = require('hdkey');
const fs = require('fs');

module.exports = folder => {
    
    if(!fs.existsSync(folder))
    {
        console.log("Folder '"+folder+"' must exist.");
        return false;
    }

    var xprvKeyFile = folder+"/key.xprv";

    if(!fs.existsSync(xprvKeyFile))
    {
        console.log("Key '"+xprvKeyFile+"' not exists.");
        return;
    }

    var xprvKey =  fs.readFileSync(xprvKeyFile);
    if(xprvKey.indexOf("xprv") != 0)
    {
        console.log("Key '"+xprvKey+"' not a private key.");
        return;
    }

    return HDKey.fromExtendedKey(xprvKey.toString());

}
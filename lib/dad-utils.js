const HDKey = require('hdkey');
const fs = require('fs');
const path = require('path');
const request = require('request'); //deprecated

const crypto = require('crypto');
const ecKeyUtils = require('eckey-utils');
const curveName = 'secp256k1';
var {Base64Encode, Base64Decode}  = require('base64-stream');





module.exports = {

    createDid : function(publicExtendedKey)
    {
        if(publicExtendedKey.indexOf("xpub") != 0)
        {
            console.log("Key '"+publicExtendedKey+"' not an extended public key.");
            return;
        }
        var key = HDKey.fromExtendedKey(publicExtendedKey.toString());
        var publicKey = key.publicKey;
        
        let b64 = Buffer.from(publicKey).toString('base64');
        b64 = b64.replace(/[+]/g, '-');
        b64 = b64.replace(/\//g,'_');
        b64 = b64.replace(/[=]+$/, '');
        return "did:dad:"+b64;

    },

    readConfig : function() {

        if(!fs.existsSync('config.json'))
        {
            console.log("Config file 'config.json' must exist.");
            return;
        }
        var data = fs.readFileSync('config.json');
        return JSON.parse(data);
    },

    createKeypair : function() {

        let config = this.readConfig();
        let folder = config.credentialPath;

        if(!fs.existsSync(folder))
        {
            console.log("Folder '"+folder+"' must exist.");
            return;
        }

        var xprvKeyFile = folder+"/key.xprv"
        var xpubKeyFile = folder+"/key.xpub"
        
        if(fs.existsSync(xprvKeyFile) || fs.existsSync(xpubKeyFile))
        {
            console.log("Cannot create key. It already exists.");
            return;
        }


        console.log("Create keypair in folder '"+folder+"'");

          
        //create extended key pair 
        let seed = crypto.randomBytes(128);
        let hdkey = HDKey.fromMasterSeed(seed);
        console.log("public key:",hdkey.publicKey.toString('hex'));

        fs.writeFileSync(xprvKeyFile, hdkey.privateExtendedKey);
        fs.writeFileSync(xpubKeyFile, hdkey.publicExtendedKey);

    },

    getHDKey : function()
    {
        let config = this.readConfig();
        if(!fs.existsSync(config.workingPath))
        {
            console.log("Folder '"+config.workingPath+"' must exist.");
            return;
        }

        var xprvKeyFile = config.credentialPath+"/key.xprv"

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

    },

    readHDKey : function(did) {

        let config = this.readConfig();
        var file = config.workingPath + "/" +did.replace(/did:dad:/, 'did_')+".json";
        if(!fs.existsSync(file))
        {
            console.log("File '"+file+"' not exists.");
            return;
        }

        var data = fs.readFileSync(file);
        var parsed = this.parse(data.toString());

        return HDKey.fromExtendedKey(parsed.document.keys[0]); //Public extended Keys

    },

    listDID : function()
    {
        var hdkey = this.getHDKey();
        var did = this.createDid(hdkey.publicExtendedKey);
        console.log("did",did);
    },

    signDocument : function(document, privateExtendedKey) {

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


        var message = JSON.stringify(document,null,2);


        //Sign
        let sign = crypto.createSign('SHA256')
        sign.update(message);
        let signBuffer = sign.sign(pems.privateKey);
        let signature = Buffer.from(signBuffer).toString('base64');
    
        return message + "\r\n\r\n" + signature;


    },

    parse : function(body) {

        var i = body.lastIndexOf("\n"); //TODO
        var message = body.substring(0,i).trim();
        var signature = body.substring(i+1);
        var document = JSON.parse(message);

        return { message : message , document: document, signature : signature };


    },

    verifyMessage : function(message, publicExtendedKey, signature) {
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
        verify.update(message);
        return verify.verify(pems.publicKey, signBuffer);

    },

    publishPublicKey : function() {

        let config = this.readConfig();
        if(!fs.existsSync(config.workingPath))
        {
            console.log("Folder '"+config.workingPath+"' must exist.");
            return;
        }

        var hdkey = this.getHDKey();
        var did = this.createDid(hdkey.publicExtendedKey);

        var document = {
            "id" : did,
            "changed" : new Date(),
            "keys" : [hdkey.publicExtendedKey.toString()]
        }


        var signedMessage = this.signDocument(document,hdkey.privateExtendedKey);
        var file = config.workingPath+"/"+did.replace(/did:dad:/, 'did_')+".json";
        
        console.log("write and send:",file);
        fs.writeFileSync(file, signedMessage);

        const options = {
            method: "POST",
            url: config.server + "/upload",
            headers: {
                //"Authorization": "Basic " + "xxx",
                "Content-Type": "multipart/form-data"
            },
            formData : {
                "files" : [fs.createReadStream(file)]
            }
        };

        request(options, function (err, res, body) {
            if(err) console.log(err);
            console.log(body);
        });
    
    },

    getDID : function(did) {

        let config = this.readConfig();
        if(!fs.existsSync(config.workingPath))
        {
            console.log("Folder '"+config.workingPath+"' must exist.");
            return;
        }

        var document = did.replace(/did:dad:/, 'did_')+".json";
        var file = config.workingPath + "/" +document;
        if(fs.existsSync(file))
        {
            console.log("Cannot create '"+document+"'. It already exists.");
            return;
        }

        const options = {
            method: "GET",
            url: config.server + "/files/"+document,
            headers: {
                //"Authorization": "Basic " + "xxx",
            }
        };

        request(options, function (err, res, body) {
            if(err) 
            {
                console.log(err);
            }
            else
            {
                console.log("received and write:",file);
                fs.writeFileSync(file, body);
            }
            
        });
    },

    getDAD : function(did,chain) {

        let config = this.readConfig();
        if(!fs.existsSync(config.workingPath))
        {
            console.log("Folder '"+config.workingPath+"' must exist.");
            return;
        }

        var hdkey = this.readHDKey(did);
        var derivedHdkey = hdkey.derive("m/"+chain);
        var ddid = this.createDid(derivedHdkey.publicExtendedKey);

        var document = ddid.replace(/did:dad:/, 'dad_')+".json";
        var file = config.workingPath + "/" +document;
        if(fs.existsSync(file))
        {
            console.log("Cannot create '"+document+"'. It already exists.");
            return;
        }

        const options = {
            method: "GET",
            url: config.server + "/files/"+document,
            headers: {
                //"Authorization": "Basic " + "xxx",
            }
        };

        request(options, function (err, res, body) {
            if(err) 
            {
                console.log(err);
            }
            else
            {
                console.log("received and write:",file);
                fs.writeFileSync(file, body);
            }
            
        });
    },
    
    verifyDID : function(did) {

        let config = this.readConfig();
        var file = config.workingPath + "/" +did.replace(/did:dad:/, 'did_')+".json";
        if(!fs.existsSync(file))
        {
            console.log("File '"+file+"' not exists.");
            return;
        }

        var data = fs.readFileSync(file);
        var parsed = this.parse(data.toString());
        var valid = this.verifyMessage(parsed.message,parsed.document.keys[0],parsed.signature);
        console.log("signatur valid:", valid);

    },

    verifyDAD : function(did,chain) {

       

        var hdkey = this.readHDKey(did);
        var derivedHdKey = hdkey.derive("m/"+chain);
        var ddid = this.createDid(derivedHdKey.publicExtendedKey);

        let config = this.readConfig();
        var file = config.workingPath + "/" +ddid.replace(/did:dad:/, 'dad_')+".json";
        if(!fs.existsSync(file))
        {
            console.log("File '"+file+"' not exists.");
            return;
        }


        var data = fs.readFileSync(file);
        var parsed = this.parse(data.toString());
        var valid = this.verifyMessage(parsed.message,derivedHdKey.publicExtendedKey,parsed.signature);
        console.log("signatur valid:", valid);

    },
    

    sendFileEncrypted(file,chain,targetDid) {

        let config = this.readConfig();
        if(!fs.existsSync(config.workingPath))
        {
            console.log("Folder '"+config.workingPath+"' must exist.");
            return;
        }

        if(!fs.existsSync(file))
        {
            console.log("File '"+file+"' not exists.");
            return;
        }        

      
        var hdkey = this.getHDKey();
        var derivedHdKey = hdkey.derive("m/"+ chain);
        var ddid = this.createDid(derivedHdKey.publicExtendedKey);
        var targetHdKey = this.readHDKey(targetDid);

        //Encrypt File
        const ec = crypto.createECDH(curveName);
        ec.setPrivateKey(derivedHdKey.privateKey);
    
        //Create secret with Diffie Hellman
        var secret = ec.computeSecret(targetHdKey.publicKey);
    
        // Encrypt file
        const ENC_KEY = Buffer.from(secret,'hex'); // set random encryption key, Buffer 32
        const IV = crypto.randomBytes(16); // set random initialisation vector Buffer 16
        const filenameEncoded =  path.basename(file)+".enc"
        const fileEnc = config.workingPath+"/"+filenameEncoded;
        let cipher = crypto.createCipheriv('aes-256-cbc', ENC_KEY, IV);
        const input = fs.createReadStream(file); 
        const output = fs.createWriteStream(fileEnc);


        input.pipe(cipher).pipe(new Base64Encode()).pipe(output).on("close",() => {

            
                let document = {
                    id : ddid,
                    changed : new Date(),
                    payload : [{
                        "file" : filenameEncoded,
                        "iv" : IV.toString('hex'),
                    }]
                };

                var signedMessage = this.signDocument(document,derivedHdKey.privateExtendedKey);
                var fileDad = config.workingPath+"/"+ddid.replace(/did:dad:/, 'dad_')+".json";
                fs.writeFileSync(fileDad, signedMessage);
        
                const options = {
                    method: "POST",
                    url: config.server + "/upload",
                    headers: {
                        //"Authorization": "Basic " + "xxx",
                        "Content-Type": "multipart/form-data"
                    },
                    formData : {
                        "files" : [
                            fs.createReadStream(fileDad), 
                            fs.createReadStream(fileEnc)
                        ]
                    }
                };
        
                request(options, function (err, res, body) {
                    if(err) console.log(err);
                    console.log(body);
                });

        });



    },

    sendFileChained : function(file,priorDid,priorChain,chain)
    {

        if(!fs.existsSync(file))
        {
            console.log("File '"+file+"' not exists.");
            return;
        }        

        var priorHdkey = this.readHDKey(priorDid);
        var priorDerivedHdKey = priorHdkey.derive("m/"+priorChain);
        var priorDdid = this.createDid(priorDerivedHdKey.publicExtendedKey);

        let config = this.readConfig();
        var priorFileDad = config.workingPath + "/" +priorDdid.replace(/did:dad:/, 'dad_')+".json";
        if(!fs.existsSync(priorFileDad))
        {
            console.log("File '"+priorFileDad+"' not exists.");
            return;
        }


        var data = fs.readFileSync(priorFileDad);

        var parsed = this.parse(data.toString());

        var valid = this.verifyMessage(parsed.message,priorDerivedHdKey.publicExtendedKey,parsed.signature);
        if(!valid)
        {
            console.log("DAD not valid.");
            return;
        }

        var prior = { id : priorDdid, sig : parsed.signature };

        var hdkey = this.getHDKey();
        var derivedHdKey = hdkey.derive("m/"+ chain);
        var ddid = this.createDid(derivedHdKey.publicExtendedKey);



        let document = {
            id : ddid,
            changed : new Date(),
            payload : [{
                "file" : path.basename(file),
            }],
            prior : prior
        };

        var signedMessage = this.signDocument(document,derivedHdKey.privateExtendedKey);
        var fileDad = config.workingPath+"/"+ddid.replace(/did:dad:/, 'dad_')+".json";
        fs.writeFileSync(fileDad, signedMessage);

        const options = {
            method: "POST",
            url: config.server + "/upload",
            headers: {
                //"Authorization": "Basic " + "xxx",
                "Content-Type": "multipart/form-data"
            },
            formData : {
                "files" : [
                    fs.createReadStream(fileDad), 
                    fs.createReadStream(file)
                ]
            }
        };

        request(options, function (err, res, body) {
            if(err) console.log(err);
            console.log(body);
        });





    },
    recvFileEncrypted : function(did,chain) {

        var ownhdkey = this.getHDKey();

        var hdkey = this.readHDKey(did);
        var derivedHdKey = hdkey.derive("m/"+chain);
        var ddid = this.createDid(derivedHdKey.publicExtendedKey);

        let config = this.readConfig();
        var file = config.workingPath + "/" +ddid.replace(/did:dad:/, 'dad_')+".json";
        if(!fs.existsSync(file))
        {
            console.log("File '"+file+"' not exists.");
            return;
        }


        var data = fs.readFileSync(file);

        var parsed = this.parse(data.toString());

        var valid = this.verifyMessage(parsed.message,derivedHdKey.publicExtendedKey,parsed.signature);
        if(!valid)
        {
            console.log("DAD not valid.");
            return;
        }


        //get file
        let datafile = parsed.document.payload[0].file;
        let IV = Buffer.from(parsed.document.payload[0].iv,'hex');

        const options = {
            method: "GET",
            url: config.server + "/files/"+datafile,
            headers: {
                //"Authorization": "Basic " + "xxx",
            }
        };

        request(options, function (err, res, body) {
            if(err) 
            {
                console.log(err);
            }
            else
            {
                console.log("received and write:",datafile);
                fs.writeFileSync(config.workingPath +"/" + datafile, body);

                //Decrypt
                const ec = crypto.createECDH(curveName);
                ec.setPrivateKey(ownhdkey.privateKey);

                //Create secret with Diffie Hellman
                var secret = ec.computeSecret(derivedHdKey.publicKey);

                // Encrypt file
                const ENC_KEY = Buffer.from(secret,'hex'); // set random encryption key, Buffer 32
                let decipher = crypto.createDecipheriv('aes-256-cbc',ENC_KEY, IV);

                const input = fs.createReadStream(config.workingPath +"/" + datafile); 
                const output = fs.createWriteStream(config.workingPath +"/" + datafile.slice(0, -4));

                input.pipe(new Base64Decode()).pipe(decipher).pipe(output).on("close",() => {

                        console.log("sucessful decoded");
                });

            }
            
        });

    }
   
}
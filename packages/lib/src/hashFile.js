const fs = require('fs');
const crypto = require('crypto');

module.exports = (file)  => {


    return new Promise(function(resolve,reject) {

        if(!fs.existsSync(file))
        {
            console.log("File '"+file+"' not exists.");
            reject();
        }

        const input = fs.createReadStream(file); 

        const sha256hash = crypto.createHash('sha256'); 
        sha256hash.setEncoding('hex');
    
        input.on('end', function() {
            sha256hash.end();
            resolve(sha256hash.read()); 
        });

        input.pipe(sha256hash);


    });
}
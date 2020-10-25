const {spawn} = require('child_process');
var dadUtils = require('./lib/dad-utils');


let config = dadUtils._readConfig();



async function run(command, version, args) {
    return new Promise(function(resolve,reject) {

        const python = spawn(command,args);
        // collect data from script
        python.stdout.on('data', function (data) {
            console.log(data.toString());
        });
        // in close event we are sure that stream from child process is closed
        python.on('close', (code) => {
            console.log(`child process close with code ${code}`);
            resolve( {
                version : version,
                command : command,
                args : args,
                code : code
            });
        });
    });
}





if(process.argv.length != 4)
{
    console.log("run with did / chain");
    process.exit(0);
}

var priorDid = process.argv[2];
var priorChain = process.argv[3];

var originDadStr = dadUtils._loadDad(priorDid,priorChain);
var originDad = JSON.parse(originDadStr.document); 

var videoFile = config.workingPath +"/" + originDad.payload[0].file.slice(0, -4);


console.log("Extract image from video");
run('ffmpeg',"4.1", ["-i" , videoFile , "-f" , "image2" , "-r" , "1/1" , "tmp/filename%03d.jpg"]).then((log) => {
    
    //Send sendFileChained : function(chain,priorDid,priorChain,data,file)

    return dadUtils.sendFileChained("0/1",originDad.id,originDadStr.signature,log,undefined);

   
}).then(() => {
    console.log("Blur faces in image");
    return run('python', "1.0.0", ['blurFaces.py' , 'tmp/filename004.jpg','tmp/filename004-blur.jpg']);
}).then((log) => {

    var ffmpegDadStr = dadUtils._loadOwnDad("0/1");
    var ffmpegDad = JSON.parse(ffmpegDadStr.document); 

    return dadUtils.sendFileChained("1/1",ffmpegDad.id,ffmpegDadStr.signature,log,'tmp/filename004-blur.jpg');

});





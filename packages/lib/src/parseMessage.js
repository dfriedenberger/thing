

module.exports = body  => {

    var i = body.lastIndexOf("\n"); //TODO
    var document = body.substring(0,i).trim();
    var signature = body.substring(i+1);

    return { document : document , signature : signature };

}
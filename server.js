const { Client } = require("./lib/router");
const { google } = require("googleapis");
const rangeParser = require('range-parser');
const path = require("path");


Client.get("/", ( req, res ) => {
    res.sendFile( path.join(__dirname,"views/index.html") )
});

Client.get("/:sess", ( req, res ) => {
    req.session.sess = req.params.sess;
    res.render("index", {
        items: req.session
    })
});


Client.get("/api/drive/stream", async ( req, res ) => {
    
    const range = req.headers.range;
    
    if ( !range ) {
        return res.status(400).send("Requires Range header");
    }
    const fileId = '1-whLtzgOR1sbdiug6SXYlY7TqKSTgoap';
    
    const auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, "lib/key/ServiceGoogleDriveKey.json"),
        scopes: ['https://www.googleapis.com/auth/drive']
    });
    const drive = google.drive({ version: 'v3', auth });
    
    const fileSizes = Number( (await drive.files.get({ fileId, fields:'size' })).data.size );
    const videoRange = range.replace(/bytes=/, '').split('-');
    const videoStart = parseInt( videoRange[0], 10 );
    const videoEnd = videoRange[1] ? parseInt( videoRange[1], 10 ) : videoStart + 1e6;
    
    const headers = {
        "Content-Range": `bytes ${videoStart}-${videoEnd}/${fileSizes}`,
        "Accept-Ranges": "bytes",
        "Content-Length": ( videoEnd - videoStart ) + 1,
        "Content-Type": "video/mp4",
    };
    res.writeHead(206, headers);
    
    drive.files.get({
        fileId,
        alt: 'media',
        fields: 'data',
        headers: {
            Range: `bytes=${ videoStart }-${ videoEnd }`
        }
    }, { responseType: 'stream' }).then( blob => blob.data.pipe(res) );
});
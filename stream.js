
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
    
    const fileSize = Number( (await drive.files.get({ fileId, fields:'size' })).data.size );
    const chunkSize = 10 ** 6;
    const videoStart = Number( range.replace(/\D/g, "") );
    const videoEnd = Math.min( videoStart + chunkSize, fileSize - 1 );
    const headers = {
        "Content-Range": `bytes ${videoStart}-${videoEnd}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": videoEnd - videoStart + 1,
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
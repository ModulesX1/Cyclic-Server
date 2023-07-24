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

Client.get('/video/drive', async (req, res) => {
    
    const fileId = '1-whLtzgOR1sbdiug6SXYlY7TqKSTgoap';
  
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, "lib/key/ServiceGoogleDriveKey.json"),
      scopes: ['https://www.googleapis.com/auth/drive']
    });
    const driveService = google.drive({ version: 'v3', auth });
  
    const fileInfo = await driveService.files.get({ fileId, fields: 'size' })
  
    const fileSize = Number(fileInfo.data.size);
  
    // Get the range from the request headers
    const rangeHeader = req.headers.range || 'bytes=0-';
    const ranges = rangeParser(fileSize, rangeHeader);
  
    if (ranges === -1) {
      // 416 Range Not Satisfiable
      res.status(416).end();
      return;
    } else if (ranges === -2 || ranges === -3) {
      // -2: Unsatisfiable range
      // -3: Invalid range
      res.status(200).end();
      return;
    }
  
    const start = ranges[0].start;
    const end = ranges[0].end || fileSize - 1;
    const chunkSize = (end - start) + 1;
  
    // Set the response headers for the video stream
    res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    res.setHeader('Content-Length', chunkSize);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.status(206);
  
    // Stream the video chunk from Google Drive to the response
    driveService.files.get({
      fileId,
      alt: 'media',
      fields: 'data',
      headers: {
        Range: `bytes=${start}-${end}`
      }
    }, { responseType: 'stream' }).then(e => {
      e.data.pipe(res);
    });
});

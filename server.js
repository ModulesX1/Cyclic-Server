const { Client } = require("./lib/router");
const { google } = require("googleapis");
const rangeParser = require('range-parser');
const path = require("path");
const credentialsKey = require("./lib/key/ServiceGoogleDriveKey.json");

class useCache {
    constructor() {
        this.metadata = new Object();
        this.get = function( id ) {
            return this.metadata[id]
        };
        this.set = function( id, size ) {
            this.metadata[id] = size
        };
    }
}

const useCaches = new useCache();

Client.get("/", ( req, res ) => {
    res.sendFile( path.join(__dirname,"views/index.html") )
});

Client.get("/:sess", ( req, res ) => {
    req.session.sess = req.params.sess;
    res.render("index", {
        items: req.session
    })
});

/*
class utilStream {
    constructor( credentials ) {
        this.GoogleAuth = new google.auth.GoogleAuth({
            credentials, scopes: ['https://www.googleapis.com/auth/drive.readonly','https://www.googleapis.com/auth/drive.metadata.readonly']
        });
        this.GoogleDrive = google.drive({ version:'v3', auth:this.GoogleAuth });
        this.loadFileMetadata = function( req, fileId ) {
            const ranges = req.headers.range;
            return new Promise( resolve => {
                this.GoogleDrive.files.get({ fileId, fields:'id,size,mimeType' })
                    .then( file => {
                        const
                            parts = ranges && ranges.replace(/bytes=/, '').split('-'),
                            id = file.data.id,
                            size = file.data.size,
                            start = ranges && parseInt( parts[0], 10 ),
                            end = ranges && ( parts[1] ? parseInt( parts[1], 10 ) : Math.min( start + 47e5, size - 1 ) ),
                            chunkSize = ranges && ( end - start + 1 ),
                            mimeType = file.data.mimeType;
                        resolve({ id, size, start, end, chunkSize, mimeType })
                    })
                    .catch( err => resolve( false ) )
            })
        };
        this.modifyInfo = null;
        this.modifyHeader = function( file ) {
            return {
                "Content-Range": `bytes ${file.start}-${file.end}/${file.size}`,
                "Accept-Ranges": "bytes",
                "Content-Length": file.chunkSize,
                "Content-Type": file.mimeType,
            }
        };
        this.renderMetadata = function( res, file ) {
            return this.GoogleDrive.files.get({
                fileId: file.id,
                alt: 'media',
                headers: {
                    Range: `bytes=${ file.start }-${ file.end }`
                }
            }, { responseType: 'stream' }).then( blob => blob.data.pipe(res) );
        };
    }
}

const util = new utilStream( credentialsKey );
*/

class utilStream {
  constructor(credentials) {
    this.GoogleAuth = new google.auth.GoogleAuth({
      credentials, scopes: ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/drive.metadata.readonly'],
    });
    this.GoogleDrive = google.drive({ version: 'v3', auth: this.GoogleAuth });
    this.loadFileMetadata = function (req, fileId) {
      const ranges = req.headers.range;
      return new Promise((resolve) => {
        this.GoogleDrive.files
          .get({ fileId, fields: 'id,size,mimeType' })
          .then((file) => {
            const parts = ranges && ranges.replace(/bytes=/, '').split('-');
            const id = file.data.id;
            const size = file.data.size;
            const start = ranges && parseInt(parts[0], 10);
            const end = ranges && (parts[1] ? parseInt(parts[1], 10) : Math.min(start + 47e5, size - 1));
            const chunkSize = ranges && end - start + 1;
            const mimeType = file.data.mimeType;
            resolve({ id, size, start, end, chunkSize, mimeType });
          })
          .catch((err) => resolve(null)); // Handle non-existent file
      });
    };
    this.modifyHeader = function (file) {
      return {
        'Content-Range': `bytes ${file.start}-${file.end}/${file.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': file.chunkSize,
        'Content-Type': file.mimeType,
      };
    };
    this.renderMetadata = async function (res, file) {
      try {
        const blob = await this.GoogleDrive.files.get(
          {
            fileId: file.id,
            alt: 'media',
            headers: {
              Range: `bytes=${file.start}-${file.end}`,
            },
          },
          { responseType: 'stream' }
        );
        blob.data.pipe(res);
      } catch (err) {
        console.error('Error rendering metadata:', err);
        res.status(500).end();
      }
    };
  }
}

// The rest of your code remains unchanged...

const util = new utilStream(credentialsKey);

Client.get("/video/:id/stream", async ( req, res ) => {
    
    const range = req.headers.range;
    const fileId = req.params.id;
    
    const file = await util.loadFileMetadata( req, fileId );
    
    if ( !file ) {
        return res.status( 404 ).json({ code:404, message:"This stream could not be found."})
    }
    
    if ( !range ) {
        
        res.writeHead( 200, {
            'Content-Length': file.size,
            'Content-Type': file.mimeType
        });
        
    } else {
        
        const header = util.modifyHeader( file );
        res.writeHead( 206, header );
        util.renderMetadata( res, file );
        
    }
    
});

Client.get("/api/drive/:id/stream", async ( req, res ) => {
    
    const range = req.headers.range;
    
    if ( !range ) {
        return res.status(400).json({ code:400, message:"Server cannot or will not process the request due to something that is perceived to be a client error." });
    }
    const fileId = req.params.id === "origin" ? '1-whLtzgOR1sbdiug6SXYlY7TqKSTgoap' : req.params.id;
    
    const auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, "lib/key/ServiceGoogleDriveKey.json"),
        scopes: ['https://www.googleapis.com/auth/drive.readonly','https://www.googleapis.com/auth/drive.metadata.readonly']
    });
    const drive = google.drive({ version: 'v3', auth });
    
    if ( fileId ) {
        if ( !useCaches.get( fileId ) ) {
            useCaches.set( fileId, Number((await drive.files.get({ fileId, fields:'size,videoMediaMetadata' })).data.size) )
            await drive.files.get({
                fileId, fields:'size,videoMediaMetadata'
            }).then( file => useCaches.set( fileId, file.data.size ) ).catch( err => range.error = err )
        }
    }
    
    if ( range.error ) {
        return res.status(404);
    }
    
    const fileSizes = useCaches.get( fileId );
    const videoStart = Number( range.replace(/\D/g, "") );
    const videoEnd = Math.min( videoStart + 47e5, fileSizes - 1 );
    const headers = {
        "Content-Range": `bytes ${videoStart}-${videoEnd}/${fileSizes}`,
        "Accept-Ranges": "bytes",
        "Content-Length": videoEnd - videoStart + 1,
        "Content-Type": "video/mp4",
    };
    res.writeHead(206, headers);
    
    drive.files.get({
        fileId,
        alt: 'media',
        headers: {
            Range: `bytes=${ videoStart }-${ videoEnd }`
        }
    }, { responseType: 'stream' }).then( blob => blob.data.pipe(res) );
});

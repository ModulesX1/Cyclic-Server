
class utilStream {
    constructor( credentials ) {
        this.GoogleAuth = new google.auth.GoogleAuth({
            credentials, scopes: ['https://www.googleapis.com/auth/drive.readonly','https://www.googleapis.com/auth/drive.metadata.readonly']
        });
        this.GoogleDrive = google.drive({ version:'v3', auth:this.GoogleAuth });
        this.loadFileMetadata = function( req, fileId ) {
            const ranges = req.headers.range;
            return new Promise( resolve => {
                drive.files.get({ fileId, fields:'id,size,mimeType' })
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
            return drive.files.get({
                fileId: file.id,
                alt: 'media',
                headers: {
                    Range: `bytes=${ file.start }-${ file.end }`
                }
            }, { responseType: 'stream' }).then( blob => blob.data.pipe(res) );
        };
    }
}

const util = new utilStream();

Client.get("/video/:id/stream", async ( req, res ) => {
    
    const range = req.headers.range;
    const fileId = req.params.id || '1-whLtzgOR1sbdiug6SXYlY7TqKSTgoap';
    
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
const { Client } = require("./lib/router");
const { Database } = require("./lib/realtime-database");

Client.get("/api/ledger/listing", async ( req, res ) => {
    const reference = Database.ref("/LedgerDB/listing");
    reference.get()
        .then( metadata => {
            metadata.exists()
                ? res.json( metadata.val() )
                : res.json( [] );
        })
        .catch( error => {
            res.json({
                code: 405, error
            })
        })
})

Client.post("/api/ledger/listing", async ( req, res ) => {
    
})
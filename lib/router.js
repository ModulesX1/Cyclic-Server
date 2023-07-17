const cookieParser = require("cookie-parser");
const session = require("express-session");
const { v4:uuid } = require("uuid");
const flash = require("express-flash");
const express = require("express");
const path = require("path");
const Client = express();

Client.use( flash() );
Client.use( cookieParser() );
Client.set( "trust proxy", !0 );
Client.use(
    session({
        proxy: true,
        unset: "destroy",
        genid: () => uuid,
        name: "connect.uid",
        store: new session.MemoryStore(),
        secret: "e1940336cabb64f372c11045d01e0d38ca182ad8",
        saveUninitialized: !0,
        rolling: !0,
        resave: !1,
        cookie: {
            secure: !0,
            maxAge: 864e5
        }
    })
);
Client.use( ( e, res, next ) => {
    res.set('x-timestamp', Date.now());
    res.set('x-powered-by', 'Kingslimes');
    next();
});
Client.set( "json spaces", 4 );
Client.set( "view engine", "ejs" );
Client.use( express.json({ limit:"1024Mb" }) );
Client.set( "views", path.join( __dirname, "../views" ) );
Client.use( express.static( path.join( __dirname, "../public" ) ) );
Client.use( express.urlencoded({ extended:false, limit:"1024Mb" }) );
Client.listen( process.env['TOKEN'] || 8080 );

module.exports = { Client };

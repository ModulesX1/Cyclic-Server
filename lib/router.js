const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("express-flash");
const express = require("express");
const path = require("path");
const Client = express();

Client.use( flash() );
Client.use( cookieParser() );
Client.set( "trust proxy", !0 );
Client.use(
    session({
        store: new session.MemoryStore(),
        secret: "ModulesX1 Webtoons",
        saveUninitialized: !0,
        resave: !0,
        cookie: {
            secure: !1,
            maxAge: 8640e4,
            expires: new Date( Date.now() + 8640e4 )
        }
    })
);
Client.use( ( m, res, next ) => {
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
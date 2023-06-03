const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("express-flash");
const express = require("express");
const path = require("path");
const Client = express();

Client.use( flash() );
Client.use( cookieParser() );
Client.set( "trust proxy", true );
Client.use(
    session({
        store: new session.MemoryStore(),
        secret: "ModulesX1 Webtoons",
        saveUninitialized: !0,
        resave: !0,
        cookie: {
            secure: !1,
            maxAge: 86400000,
            expires: new Date( Date.now() + 86400000 )
        }
    })
);
Client.use( function( req, res, next ) {
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
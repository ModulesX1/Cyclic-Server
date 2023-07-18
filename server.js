const { Client } = require("./lib/router");

Client.get("/", ( req, res ) => {
    res.render("index", {
        items: req.session
    })
});

Client.get("/:sess", ( req, res ) => {
    req.session.sess = req.params.sess;
    res.render("index", {
        items: req.session
    })
});

Client.get("/api/iea/list", ( req, res ) => {
    req.session.sess = req.params.sess;
    res.render("index", {
        items: req.session
    })
});

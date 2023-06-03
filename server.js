const { Client } = require("./lib/router");

Client.get("/", ( req, res ) => {
  res.render("index", {
    items: req.session
  })
})

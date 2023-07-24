const { Client } = require("./lib/router");
const axios = require("axios");

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

Client.get("/video/drive", ( req, res ) => {
    const videoUrl = "https://drive.google.com/uc?id=157kXP_fE1SMtLPWQ6FysNnAqNhfY-BvO"; // ใส่ URL ของวีดีโอที่ต้องการ
    res.setHeader('Content-Type', 'video/mp4'); // แทนที่ด้วย MIME type ที่ถูกต้องถ้าวีดีโอของคุณเป็นไฟล์อื่น
    res.setHeader('Content-Disposition', 'inline');
    axios({
        method: 'get',
        url: videoUrl,
        responseType: 'stream',
    })
    .then((response) => {
        response.data.pipe(res);
    })
    .catch((err) => {
        res.status(500).send('Failed to serve video.');
    });
});

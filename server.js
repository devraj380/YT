const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core-discord'); // <-- The crucial change is here
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/', (req, res) => {
    res.send('YouTube Downloader Backend v2 is running!');
});

app.get('/videoInfo', async (req, res) => {
    const videoURL = req.query.url;
    if (!videoURL) {
        return res.status(400).json({ error: "No URL provided." });
    }
    
    try {
        // We use ytdl.getBasicInfo for speed and reliability.
        const info = await ytdl.getBasicInfo(videoURL);
        const formats = info.formats.filter(f => f.hasVideo && f.hasAudio);

        res.json({
            title: info.videoDetails.title,
            thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
            formats: formats.map(f => ({
                quality: f.qualityLabel,
                itag: f.itag,
                container: f.container
            }))
        });
    } catch (error) {
        // Log the actual error on the server for debugging
        console.error("Error fetching video info:", error.message); 
        res.status(500).json({ error: "Failed to fetch video information. The video might be private, age-restricted, or removed. It's also possible our server is being blocked by YouTube." });
    }
});

app.get('/download', async (req, res) => {
    try {
        const { url, itag, title } = req.query;
        if (!url || !itag) {
            return res.status(400).send('Missing URL or format information.');
        }

        res.header('Content-Disposition', `attachment; filename="${title}.mp4"`);
        res.header('Content-Type', 'video/mp4');

        const stream = await ytdl(url, { filter: format => format.itag == itag });
        stream.pipe(res);

    } catch (error) {
        console.error("Error during download:", error.message);
        res.status(500).send('Error downloading video.');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

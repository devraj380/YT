const express = require('express');
const cors = require('cors'); // Import the cors package
const ytdl = require('ytdl-core');
const app = express();
const PORT = process.env.PORT || 3000;

// Use CORS to allow requests from your Blogger site
app.use(cors());

// Health check endpoint
app.get('/', (req, res) => {
    res.send('YouTube Downloader Backend is running!');
});

// Endpoint to get video info
app.get('/videoInfo', async (req, res) => {
    const videoURL = req.query.url;
    if (!ytdl.validateURL(videoURL)) {
        return res.status(400).json({ error: "Invalid YouTube URL." });
    }
    try {
        const info = await ytdl.getInfo(videoURL);
        res.json({
            title: info.videoDetails.title,
            thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
            formats: ytdl.filterFormats(info.formats, 'videoandaudio').map(f => ({
                quality: f.qualityLabel,
                itag: f.itag,
                container: f.container
            }))
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch video information. The video might be private, age-restricted, or removed." });
    }
});

// Endpoint to download the video
app.get('/download', async (req, res) => {
    try {
        const { url, itag, title } = req.query;
        if (!ytdl.validateURL(url)) {
            return res.status(400).send('Invalid YouTube URL.');
        }
        const info = await ytdl.getInfo(url);
        const format = ytdl.chooseFormat(info.formats, { quality: itag });
        res.header('Content-Disposition', `attachment; filename="${title}.${format.container}"`);
        ytdl(url, { format }).pipe(res);
    } catch (error) {
        res.status(500).send('Error downloading video.');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
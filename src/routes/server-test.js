// server.js (or routes file)
import express from 'express';
import fetch from 'node-fetch'; // or axios
import cors from 'cors';

// const app = express();
// app.use(cors()); // allow your frontend origin



// app.get('/s', async (req, res) => {
//   try {
//     const REDIRECT_URI = "http://localhost:5173/stats.html";
//     const scopes = ["daily", "heartrate", "personal"];
//     const apiRes = await fetch(`https://cloud.ouraring.com/oauth/authorize?`+
//         `client_id=${process.env.VITE_oura_client_id}&`+
//         `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
//         `response_type=token&` +
//         `scope=${scopes.join(" ")}`
//     );
//     const data = await apiRes.json();
//     res.json("test2"); // send to frontend
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to load stats' });
//   }
// });

// app.listen(5000, () => console.log('API proxy on :5000'));

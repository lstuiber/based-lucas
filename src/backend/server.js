import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
dotenv.config({ path: '../../.env' });
const app = express();
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
// app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
const PORT = 3000;

// app.use(cors()); // or configure with specific origin
app.get('/', async (req, res) => {
  console.log(req.cookies)
  res.json(['Shirt', 'Pants', 'Shoes']);
})

// Proxy route for your external API
app.post('/api/stats', async (req, res) => {
  try {
        const {code} = req.body;
    console.log("code", code);
    const REDIRECT_URI = "http://localhost:5173/dashboard.html";
    const scopes = ["daily", "heartrate", "personal"];
    const apiRes = await fetch(`https://api.ouraring.com/oauth/token`, {
        method: "POST",
            headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      client_id: `${process.env.oura_client_id}`,
      client_secret: `${process.env.oura_secret}`,
      redirect_uri: "http://localhost:5173/dashboard.html"
    })
    }
    );
    const data = await apiRes.json();

    if (req.cookies.refreshToken != undefined) {
    res.cookie("refreshToken", data.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    })
  }
  console.log("cookie", req.cookies.refreshToken);
    const { refresh_token, ...rest } = data;
    res.json(rest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

app.post('/api/sleep', async (req, res) => {
        const startDate = "2026-01-01";
        const endDate = "2026-01-07";
        const { accessToken } = req.body;
          const response = await fetch(
    `https://api.ouraring.com/v2/usercollection/sleep?start_date=${startDate}&end_date=${endDate}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );
    res.json(await response.json());
})

// need to add refreshToken endpoint

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
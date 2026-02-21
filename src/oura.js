
window.onload = async function getData() {
    const REDIRECT_URI = "http://localhost:5173/dashboard.html";
    const scopes = ["daily", "heartrate", "personal"];
    window.location.href = `https://cloud.ouraring.com/oauth/authorize?`+
        `client_id=${import.meta.env.VITE_oura_client_id}&`+
        `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
        `response_type=code&` +
        `scope=${scopes.join(" ")}`
    ;
      window.location.href = authUrl;
}
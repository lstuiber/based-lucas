
async function dashboard() {
    const thecode = getAuthCode();
    const data = await fetch('http://localhost:3000/api/stats', {
        method: 'POST',
        credentials: 'include',
        body: new URLSearchParams({
            code: thecode
        })
    })
    const values = await data.json();
    console.log(values)
    console.log(await values.access_token);
    
    const getSleepData = await fetch('http://localhost:3000/api/sleep', {
        method: 'POST',
        body: new URLSearchParams({
            accessToken: values.access_token
        })
    })
    // await fetch('http://localhost:3000');
    const sleepScores = await getSleepData.json();
    console.log(await sleepScores);
}

function getAuthCode() {
        const urlString = new URLSearchParams(document.location.search);
        const code = urlString.get('code');
    return code;
}

dashboard();
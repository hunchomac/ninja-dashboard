const https = require('https');

let cachedToken = null;
let tokenExpiry = null;

async function getNinjaToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  return new Promise((resolve, reject) => {
    const data = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.NINJA_CLIENT_ID,
      client_secret: process.env.NINJA_CLIENT_SECRET,
      scope: 'monitoring management'
    }).toString();

    const options = {
      hostname: 'app.ninjarmm.com',
      path: '/ws/oauth/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const result = JSON.parse(body);
        cachedToken = result.access_token;
        tokenExpiry = Date.now() + (result.expires_in - 60) * 1000;
        resolve(cachedToken);
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

module.exports = async function (context, req) {
  try {
    const token = await getNinjaToken();

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'app.ninjarmm.com',
        path: '/v2/devices-detailed',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const apiReq = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          context.res = {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.parse(body)
          };
          resolve();
        });
      });

      apiReq.on('error', (err) => {
        context.res = {
          status: 500,
          body: { error: err.message }
        };
        resolve();
      });

      apiReq.end();
    });
  } catch (error) {
    context.res = {
      status: 500,
      body: { error: error.message }
    };
  }
};

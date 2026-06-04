const https = require('https');

async function getNinjaToken() {
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
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.access_token) {
            resolve(result.access_token);
          } else {
            reject(new Error(`Token error: ${JSON.stringify(result)}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${body}`));
        }
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

    return new Promise((resolve) => {
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
          try {
            const devices = JSON.parse(body);
            context.res = {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ devices: devices })
            };
          } catch (e) {
            context.res = {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ error: 'Failed to parse devices', raw: body })
            };
          }
          resolve();
        });
      });

      apiReq.on('error', (err) => {
        context.res = {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: err.message })
        };
        resolve();
      });

      apiReq.end();
    });
  } catch (error) {
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};

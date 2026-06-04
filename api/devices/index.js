module.exports = async function (context, req) {
  context.res = {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Function is working!', clientId: process.env.NINJA_CLIENT_ID ? 'Found' : 'Missing' })
  };
};

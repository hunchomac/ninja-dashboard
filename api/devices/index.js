const { app } = require('@azure/functions');

app.http('devices', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    return {
      jsonBody: { message: 'Function is working!' }
    };
  }
});

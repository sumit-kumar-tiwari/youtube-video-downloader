// File: netlify/functions/getYoutubeInfo.js

// Using 'node-fetch' which is a standard for server-side fetch calls.
// Netlify functions automatically handle installing this if you have a package.json
// or you can just rely on the built-in fetch in recent Node versions.
const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  // Get the YouTube URL from the query parameter
  const videoURL = event.queryStringParameters.url;

  if (!videoURL) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'YouTube URL is required' }),
    };
  }

  // This is the actual API we will call from our serverless function
  const COBALT_API_URL = 'https://co.wuk.sh/api/json';

  try {
    const response = await fetch(COBALT_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: videoURL,
        vQuality: '1080', // Ask for 1080p by default
        isAudioOnly: false,
      }),
    });

    if (!response.ok) {
        // If the API itself returns an error
        const errorData = await response.json();
        return {
            statusCode: response.status,
            body: JSON.stringify({ error: errorData.text || 'Failed to fetch from Cobalt API.' }),
        };
    }

    const data = await response.json();

    // Send the successful data back to your frontend
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };

  } catch (error) {
    // If our function has a problem
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Serverless function error: ${error.message}` }),
    };
  }
};
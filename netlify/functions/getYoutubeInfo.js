// File: netlify/functions/getYoutubeInfo.js

// Ab humein node-fetch ki zaroorat nahi, Netlify ke naye versions mein fetch built-in hai.
exports.handler = async function (event, context) {
  const videoURL = event.queryStringParameters.url;

  if (!videoURL) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'YouTube URL is required' }),
    };
  }

  // Yeh ek nayi aur alag API hai
  const API_ENDPOINT = `https://yt-dlx.vercel.app/api/info?url=${encodeURIComponent(videoURL)}`;

  try {
    const response = await fetch(API_ENDPOINT);
    if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
    }
    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

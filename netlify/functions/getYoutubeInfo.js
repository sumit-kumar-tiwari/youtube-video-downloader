// File: netlify/functions/getYoutubeInfo.js

exports.handler = async function (event, context) {
  const videoURL = event.queryStringParameters.url;

  if (!videoURL) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'YouTube URL is required' }),
    };
  }

  // Hum is public API ko wapas use karenge jo YouTube ki blocking handle karti hai
  const API_ENDPOINT = `https://yt-dlx.vercel.app/api/info?url=${encodeURIComponent(videoURL)}`;

  try {
    const response = await fetch(API_ENDPOINT);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API responded with status: ${response.status}`);
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

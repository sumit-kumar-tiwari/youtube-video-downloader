// netlify/functions/getYoutubeInfo.js

export const handler = async (event) => {
  // Frontend se bheja gaya video URL yahan milega
  const { url: videoURL } = event.queryStringParameters;

  if (!videoURL) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'URL parameter is missing' }),
    };
  }

  try {
    // Proxy server, Cobalt API se baat karega (yahan CORS error nahi aayega)
    const apiResponse = await fetch('https://co.wuk.sh/api/json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ url: videoURL }),
    });

    if (!apiResponse.ok) {
      throw new Error(`API server responded with status: ${apiResponse.status}`);
    }

    const data = await apiResponse.json();

    // API se mila data wapas frontend ko bhej do
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
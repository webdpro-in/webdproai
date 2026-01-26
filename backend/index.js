exports.hello = async (event) => {
    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: 'WebDPro Backend is running!',
            timestamp: new Date().toISOString()
        })
    };
};

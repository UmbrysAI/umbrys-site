const { tweetScheduler } = require('./index.js');

// Mock Pub/Sub event
const mockEvent = {
    data: Buffer.from(JSON.stringify({ test: 'message' })).toString('base64'),
};

// Call the scheduled function
tweetScheduler(mockEvent, {})
    .then(() => {
        console.log('Function executed successfully');
    })
    .catch((error) => {
        console.error('Function execution failed:', error);
    });

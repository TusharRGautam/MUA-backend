const express = require('express');
const router = express.Router();

// In-memory storage for demo purposes
// In production, use a proper database
const userTokens = new Map();

// Make userTokens globally accessible for the user notification service
global.userTokens = userTokens;

// Register push token for a user
router.post('/register-push-token', async (req, res) => {
  try {
    const { token, userId, platform } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Push token is required' });
    }

    // Store the token (in production, save to database)
    userTokens.set(userId || 'anonymous', {
      token,
      platform,
      registeredAt: new Date().toISOString(),
    });

    console.log(`Push token registered for user ${userId || 'anonymous'}: ${token}`);

    res.json({
      success: true,
      message: 'Push token registered successfully',
    });
  } catch (error) {
    console.error('Error registering push token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send push notification to a specific user
router.post('/send-notification', async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({ error: 'userId, title, and body are required' });
    }

    const userToken = userTokens.get(userId);
    if (!userToken) {
      return res.status(404).json({ error: 'User token not found' });
    }

    const message = {
      to: userToken.token,
      sound: 'default',
      title,
      body,
      data: data || {},
      priority: 'high',
    };

    // Send notification using Expo Push API
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (result.data && result.data.status === 'ok') {
      console.log(`Push notification sent to user ${userId}`);
      res.json({
        success: true,
        message: 'Push notification sent successfully',
        result,
      });
    } else {
      console.error('Failed to send push notification:', result);
      res.status(500).json({
        error: 'Failed to send push notification',
        details: result,
      });
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send push notification to all registered users
router.post('/send-broadcast', async (req, res) => {
  try {
    const { title, body, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'title and body are required' });
    }

    const tokens = Array.from(userTokens.values()).map(user => user.token);

    if (tokens.length === 0) {
      return res.status(404).json({ error: 'No registered tokens found' });
    }

    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: data || {},
      priority: 'high',
    }));

    // Send notifications using Expo Push API
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();

    console.log(`Broadcast notification sent to ${tokens.length} users`);
    res.json({
      success: true,
      message: `Broadcast notification sent to ${tokens.length} users`,
      result,
    });
  } catch (error) {
    console.error('Error sending broadcast notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all registered tokens (for admin purposes)
router.get('/tokens', (req, res) => {
  try {
    const tokens = Array.from(userTokens.entries()).map(([userId, data]) => ({
      userId,
      ...data,
    }));

    res.json({
      success: true,
      tokens,
      count: tokens.length,
    });
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove a user's push token
router.delete('/remove-token/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    if (userTokens.has(userId)) {
      userTokens.delete(userId);
      res.json({
        success: true,
        message: 'Push token removed successfully',
      });
    } else {
      res.status(404).json({ error: 'User token not found' });
    }
  } catch (error) {
    console.error('Error removing token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 
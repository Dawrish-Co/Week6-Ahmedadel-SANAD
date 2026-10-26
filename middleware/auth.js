const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

function authenticate(req, res, next) {
  const authorization = req.get('authorization');
  const tokenMatch = authorization && authorization.match(/^Bearer\s+(\S+)$/i);

  if (!tokenMatch) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'Authentication is not configured' });
  }

  try {
    const payload = jwt.verify(tokenMatch[1], secret, {
      algorithms: ['HS256'],
    });

    if (typeof payload !== 'object' || payload === null) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    const userId = payload.sub || payload.id || payload._id;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    req.user = { id: userId, _id: userId };
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Invalid or expired authentication token' });
    }
    return next(error);
  }
}

module.exports = authenticate;

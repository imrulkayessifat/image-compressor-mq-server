import rateLimit from 'express-rate-limit';

export const rateLimiterUsingThirdParty = rateLimit({
  windowMs: 1000,
  max: 2,
  message: 'You have exceeded the 100 requests in 24 hrs limit!', 
  standardHeaders: true,
  legacyHeaders: false,
});
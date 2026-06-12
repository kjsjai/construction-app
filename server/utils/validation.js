import { z } from 'zod';

export const validateRequest = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (error) {
    return res.status(422).json({ message: 'Validation error', errors: error.errors });
  }
};

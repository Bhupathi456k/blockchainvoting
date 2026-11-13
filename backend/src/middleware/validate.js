const { validationResult } = require('express-validator');

/**
 * Validation middleware
 * Checks for validation errors from express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorList = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));
    return res.status(400).json({
      success: false,
      error: errorList[0]?.message || 'Validation failed',
      errors: errorList,
    });
  }

  next();
};

module.exports = validate;

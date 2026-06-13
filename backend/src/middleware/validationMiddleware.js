// Generic validation middleware creator
const validateBody = (schema) => {
  return (req, res, next) => {
    const errors = [];
    const sanitizedBody = {};

    const bodyKeys = Object.keys(req.body);
    const schemaKeys = Object.keys(schema);

    // Reject unexpected fields to prevent mass-assignment/pollution
    for (const key of bodyKeys) {
      if (!schemaKeys.includes(key)) {
        return res.status(400).json({
          success: false,
          message: `Unexpected field: '${key}' is not allowed.`
        });
      }
    }

    // Validate allowed fields
    for (const key of schemaKeys) {
      const rules = schema[key];
      let value = req.body[key];

      // Required check
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`Field '${key}' is required.`);
        continue;
      }

      if (value !== undefined && value !== null && value !== '') {
        // Type checks & checks matching rules
        if (rules.type === 'string') {
          if (typeof value !== 'string') {
            errors.push(`Field '${key}' must be a string.`);
            continue;
          }
          value = value.trim();
          
          // HTML injection prevention sanitization
          if (rules.sanitize) {
            value = value
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#x27;')
              .replace(/\//g, '&#x2F;');
          }

          // Length constraint check
          if (rules.minLength && value.length < rules.minLength) {
            errors.push(`Field '${key}' must be at least ${rules.minLength} characters.`);
          }
          if (rules.maxLength && value.length > rules.maxLength) {
            errors.push(`Field '${key}' must be at most ${rules.maxLength} characters.`);
          }

          // Pattern checks
          if (rules.regex && !rules.regex.test(value)) {
            errors.push(rules.message || `Field '${key}' format is invalid.`);
          }

          // Enum check
          if (rules.enum && !rules.enum.includes(value)) {
            errors.push(`Field '${key}' must be one of: ${rules.enum.join(', ')}.`);
          }
        } else if (rules.type === 'number') {
          if (typeof value !== 'number' && isNaN(Number(value))) {
            errors.push(`Field '${key}' must be a number.`);
            continue;
          }
          value = Number(value);
          if (rules.min !== undefined && value < rules.min) {
            errors.push(`Field '${key}' must be at least ${rules.min}.`);
          }
          if (rules.max !== undefined && value > rules.max) {
            errors.push(`Field '${key}' must be at most ${rules.max}.`);
          }
        }

        sanitizedBody[key] = value;
      } else if (rules.default !== undefined) {
        sanitizedBody[key] = rules.default;
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors,
        message: errors.join(' ')
      });
    }

    // Overwrite request body with only validated and sanitized fields
    req.body = sanitizedBody;
    next();
  };
};

const registerSchema = {
  name: { type: 'string', required: true, minLength: 2, maxLength: 50, sanitize: true },
  email: { type: 'string', required: true, regex: /^\S+@\S+\.\S+$/, message: 'Please provide a valid email address.' },
  phone: { type: 'string', required: true, regex: /^(?:\+91[\s\-]?)?[6-9]\d{9}$/, message: 'Please provide a valid 10-digit mobile number.' },
  password: { type: 'string', required: true, minLength: 6, maxLength: 100 }
};

const verifyRegisterSchema = {
  email: { type: 'string', required: true, regex: /^\S+@\S+\.\S+$/, message: 'Please provide a valid email address.' },
  otp: { type: 'string', required: true, regex: /^\d{6}$/, message: 'OTP must be exactly 6 digits.' }
};

const loginSchema = {
  email: { type: 'string', required: true, regex: /^\S+@\S+\.\S+$/, message: 'Please provide a valid email address.' },
  password: { type: 'string', required: true }
};

const forgotPasswordSchema = {
  email: { type: 'string', required: true, regex: /^\S+@\S+\.\S+$/, message: 'Please provide a valid email address.' }
};

const resetPasswordSchema = {
  email: { type: 'string', required: true, regex: /^\S+@\S+\.\S+$/, message: 'Please provide a valid email address.' },
  otp: { type: 'string', required: true, regex: /^\d{6}$/, message: 'OTP must be exactly 6 digits.' },
  newPassword: { type: 'string', required: true, minLength: 6, maxLength: 100 }
};

const updateProfileSchema = {
  name: { type: 'string', required: false, minLength: 2, maxLength: 50, sanitize: true },
  phone: { type: 'string', required: false, regex: /^(?:\+91[\s\-]?)?[6-9]\d{9}$/, message: 'Please provide a valid 10-digit mobile number.' },
  avatar: { type: 'string', required: false, maxLength: 200, sanitize: true },
  password: { type: 'string', required: false, minLength: 6, maxLength: 100 }
};

const bookTokenSchema = {
  service: { type: 'string', required: true, enum: ['hospital', 'bank', 'college', 'government', 'salon'] },
  priority: { type: 'string', required: false, enum: ['normal', 'senior', 'vip', 'emergency', 'Senior Citizen', 'VIP', 'Emergency', 'Normal'], default: 'normal' },
  priorityType: { type: 'string', required: false, enum: ['normal', 'senior', 'vip', 'emergency', 'Senior Citizen', 'VIP', 'Emergency', 'Normal'] },
  timeSlot: { type: 'string', required: true, maxLength: 100, sanitize: true },
  bookingDate: { type: 'string', required: true, regex: /^\d{4}-\d{2}-\d{2}$/, message: 'Booking date must be in YYYY-MM-DD format.' },
  name: { type: 'string', required: true, minLength: 2, maxLength: 50, sanitize: true },
  phone: { type: 'string', required: true, regex: /^(?:\+91[\s\-]?)?[6-9]\d{9}$/, message: 'Please provide a valid 10-digit mobile number.' }
};

const verifyTokenSchema = {
  displayId: { type: 'string', required: true, regex: /^[A-Z]\d{3}$/, message: 'Display ID must be in standard format (e.g. H001).' }
};

module.exports = {
  validateBody,
  registerSchema,
  verifyRegisterSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  bookTokenSchema,
  verifyTokenSchema,
};

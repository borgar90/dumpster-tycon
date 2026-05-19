const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DISPLAY_NAME_REGEX = /^[\p{L}\p{N} _.-]+$/u;
const CONTROL_CHAR_REGEX = /[\u0000-\u001F\u007F]/;

export function validateEmail(email: string) {
  if (!email) {
    return 'Email is required.';
  }

  if (!EMAIL_REGEX.test(email)) {
    return 'Enter a valid email address.';
  }

  return null;
}

export function validatePassword(password: string, label = 'Password') {
  if (!password) {
    return `${label} is required.`;
  }

  if (password.length < 8) {
    return `${label} must be at least 8 characters.`;
  }

  if (password.length > 72) {
    return `${label} must be 72 characters or fewer.`;
  }

  return null;
}

export function normalizeDisplayName(value: string) {
  return value.trim().replace(/\s+/g, ' ').slice(0, 32);
}

export function validateDisplayName(value: string) {
  if (!value) {
    return 'Display name is required.';
  }

  if (value.length < 2) {
    return 'Display name must be at least 2 characters.';
  }

  if (!DISPLAY_NAME_REGEX.test(value)) {
    return 'Display name can only use letters, numbers, spaces, dots, dashes, and underscores.';
  }

  return null;
}

export function normalizeAvatar(value: string) {
  return value.trim().slice(0, 4);
}

export function validateAvatar(value: string) {
  if (!value) {
    return 'Avatar is required.';
  }

  if (CONTROL_CHAR_REGEX.test(value)) {
    return 'Avatar contains invalid characters.';
  }

  return null;
}

export function normalizeBio(value: string) {
  return value.trim().slice(0, 160);
}

export function validateBio(value: string) {
  if (CONTROL_CHAR_REGEX.test(value)) {
    return 'Bio contains invalid characters.';
  }

  return null;
}
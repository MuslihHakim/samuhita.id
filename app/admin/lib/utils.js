// Utility helpers extracted from AdminDashboard

export function maskEmail(email) {
  if (!email) return '';
  const [username, domain] = String(email).split('@');
  if (!domain) return email;

  const maskedUsername = username.length > 2
    ? username[0] + '*'.repeat(username.length - 2) + username[username.length - 1]
    : '*'.repeat(username.length);

  return `${maskedUsername}@${domain}`;
}

export function maskPhoneNumber(phone) {
  if (!phone) return '';
  const cleanPhone = String(phone).replace(/\D/g, '');
  if (cleanPhone.length <= 4) return '*'.repeat(cleanPhone.length);

  const visibleChars = Math.min(4, cleanPhone.length);
  const maskedLength = cleanPhone.length - visibleChars;
  return '*'.repeat(maskedLength) + cleanPhone.slice(-visibleChars);
}

export function maskPassword(password) {
  if (!password) return '';
  return '*'.repeat(String(password).length);
}

export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email));
}

export function isValidPhone(phone) {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(String(phone)) && String(phone).replace(/\D/g, '').length >= 10;
}




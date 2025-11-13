let submissionUserIdColumnAvailable = true;
let warningLogged = false;

function isMissingUserIdColumnError(error) {
  if (!error) return false;
  if (error.code === 'PGRST204') return true;
  const message = typeof error.message === 'string' ? error.message : '';
  return message.includes("'userId' column") || message.includes('"userId"');
}

export function isSubmissionUserIdColumnAvailable() {
  return submissionUserIdColumnAvailable;
}

export function handleSubmissionUserIdColumnError(error, context) {
  if (!isMissingUserIdColumnError(error)) {
    return false;
  }

  if (submissionUserIdColumnAvailable) {
    submissionUserIdColumnAvailable = false;
    if (!warningLogged) {
      const prefix = context ? `[${context}] ` : '';
      console.warn(
        `${prefix}submissions.userId column not found; skipping userId persistence until the database migration is applied.`,
      );
      warningLogged = true;
    }
  }

  return true;
}

export function resetSubmissionUserIdColumnAvailability() {
  submissionUserIdColumnAvailable = true;
  warningLogged = false;
}

// =============================================
// REGEX VALIDATION RULES
// =============================================

// Rule 1: Title — no leading/trailing spaces, no double spaces
const RE_TITLE = /^\S(?:.*\S)?$/;

// Rule 2: Duration — positive integer or decimal (minutes)
const RE_DURATION = /^(0|[1-9]\d*)(\.\d{1,2})?$/;

// Rule 3: Date — YYYY-MM-DD strict format
const RE_DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

// Rule 4: Tag — letters, spaces, hyphens only
const RE_TAG = /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/;

// Advanced Rule (lookahead): Detect duplicate consecutive words e.g. "the the exam"
const RE_DUPLICATE_WORD = /\b(\w+)\s+\1\b/i;

export function validateTitle(value) {
  if (!value || value.trim() === '') return 'Title is required.';
  if (!RE_TITLE.test(value)) return 'Title must not have leading/trailing spaces or double spaces.';
  if (RE_DUPLICATE_WORD.test(value)) return 'Title contains a repeated word (e.g. "the the").';
  if (value.length > 120) return 'Title must be 120 characters or fewer.';
  return null;
}

export function validateDuration(value) {
  if (!value && value !== 0) return 'Duration is required.';
  if (!RE_DURATION.test(String(value))) return 'Duration must be a positive number (e.g. 90 or 1.5).';
  if (Number(value) <= 0) return 'Duration must be greater than 0.';
  if (Number(value) > 1440) return 'Duration cannot exceed 1440 minutes (24h).';
  return null;
}

export function validateDate(value) {
  if (!value) return 'Date is required.';
  if (!RE_DATE.test(value)) return 'Date must be in YYYY-MM-DD format.';
  const d = new Date(value);
  if (isNaN(d.getTime())) return 'Date is not a valid calendar date.';
  return null;
}

export function validateTag(value) {
  if (!value) return 'Please select or enter a tag.';
  if (!RE_TAG.test(value)) return 'Tag must contain only letters, spaces, or hyphens.';
  return null;
}

export function validateRecord(rec) {
  const errors = [];
  const t = validateTitle(rec.title);
  const d = validateDuration(rec.duration);
  const dt = validateDate(rec.dueDate);
  const tg = validateTag(rec.tag);
  if (t)  errors.push(`title: ${t}`);
  if (d)  errors.push(`duration: ${d}`);
  if (dt) errors.push(`dueDate: ${dt}`);
  if (tg) errors.push(`tag: ${tg}`);
  return errors;
}

export function validateForm({ title, duration, dueDate, tag }) {
  const errors = {
    title: validateTitle(title),
    duration: validateDuration(duration),
    dueDate: validateDate(dueDate),
    tag: validateTag(tag),
  };
  const valid = Object.values(errors).every(e => e === null);
  return { valid, errors };
}
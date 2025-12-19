import { ApiError } from "./ApiError.js";

const isValidDate = (date) => !Number.isNaN(date?.getTime?.());

const tryParseDayFirst = (raw) => {
  if (typeof raw !== "string") return null;

  const normalized = raw.trim().replace(/[/.]/g, "-");
  const parts = normalized.split("-").map((part) => part.trim());

  if (parts.length !== 3) return null;

  const [dayStr, monthStr, yearStr] = parts;

  const day = Number(dayStr);
  const month = Number(monthStr);
  const year = Number(yearStr);

  if (
    !Number.isInteger(day) ||
    !Number.isInteger(month) ||
    !Number.isInteger(year) ||
    day < 1 ||
    month < 1 ||
    month > 12 ||
    year < 1970
  ) {
    return null;
  }

  const candidate = new Date(year, month - 1, day);
  candidate.setHours(0, 0, 0, 0);

  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return null;
  }

  return candidate;
};

export const normalizeMembershipStartDate = (input) => {
  if (!input && input !== 0) {
    throw new ApiError(400, "Membership start date is required");
  }

  let parsed = input instanceof Date ? new Date(input) : new Date(input);

  if (!isValidDate(parsed) && typeof input === "string") {
    parsed = tryParseDayFirst(input);
  }

  if (!isValidDate(parsed)) {
    throw new ApiError(400, "Invalid membership start date provided");
  }

  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

export const calculateMembershipEndDate = (startDate, durationInMonths) => {
  if (!Number.isFinite(durationInMonths) || durationInMonths <= 0) {
    throw new ApiError(400, "Membership plan duration must be greater than zero");
  }

  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + durationInMonths);
  return endDate;
};

export const determineMembershipStatus = (startDate, endDate) => {
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return "inactive";
  }

  const now = new Date();

  if (now < startDate) return "inactive";
  if (now > endDate) return "expired";
  return "active";
};

export const buildMembershipWindow = (startDateInput, durationInMonths) => {
  const startDate = normalizeMembershipStartDate(startDateInput);
  const endDate = calculateMembershipEndDate(startDate, durationInMonths);
  const status = determineMembershipStatus(startDate, endDate);

  return { startDate, endDate, status };
};

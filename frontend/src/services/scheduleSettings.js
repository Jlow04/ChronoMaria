const STORAGE_KEY = 'scheduleSettings';

export const defaultScheduleSettings = {
  max_generations: 300,
  population_size: 60,
  mutation_rate: 0.1,
  max_runtime_seconds: 20,
};

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const normalizeScheduleSettings = (settings = {}) => {
  const merged = {
    ...defaultScheduleSettings,
    ...settings,
  };

  const normalized = {
    max_generations: Math.max(20, Math.min(1000, Math.round(toNumber(merged.max_generations, defaultScheduleSettings.max_generations)))),
    population_size: Math.max(10, Math.min(300, Math.round(toNumber(merged.population_size, defaultScheduleSettings.population_size)))),
    mutation_rate: Math.max(0.01, Math.min(0.5, toNumber(merged.mutation_rate, defaultScheduleSettings.mutation_rate))),
    max_runtime_seconds: Math.max(5, Math.min(180, Math.round(toNumber(merged.max_runtime_seconds, defaultScheduleSettings.max_runtime_seconds)))),
  };

  return normalized;
};

export const getScheduleSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultScheduleSettings;
    }

    return normalizeScheduleSettings(JSON.parse(raw));
  } catch (_error) {
    return defaultScheduleSettings;
  }
};

export const saveScheduleSettings = (settings) => {
  const normalized = normalizeScheduleSettings(settings);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
};

export const resetScheduleSettings = () => {
  localStorage.removeItem(STORAGE_KEY);
  return defaultScheduleSettings;
};

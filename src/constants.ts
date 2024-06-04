export const CONFIRM_EMOJI = '✅';
export const DECLINE_EMOJI = '❌';

export const ONE_MINUTE_MS = 1000 * 60;
export const CONFIRMATION_DEFAULT_TIMEOUT = 30 * 1000;
export const INTERACTION_MAX_TIMEOUT = ONE_MINUTE_MS * 15;
export const REWIND_BUTTON_TIME = 15 * 1000;
export const FAST_FORWARD_BUTTON_TIME = 15 * 1000;
export const LONG_COOKIE_TIMEOUT = 365 * 24 * 60 * ONE_MINUTE_MS;

export const DIGITS_REGEX = /^\d+$/;
export const CHANNEL_ARG_REGEX = /^<#\d+>$/;
export const ROLE_ARG_REGEX = /^<@&\d+>$/;
export const USER_ARG_REGEX = /^<@\d+>$/;
export const USER_DISCRIMINATOR_REGEX = /^(.+)#(\d{4})$/;

export const Colors = Object.freeze({
  SUCCESS: '#208637',
  WARN: '#FFC107',
  DANGER: '#F44336',
} as const);

export const BULK_MESSAGES_LIMIT = 100;
export const MAX_MESSAGES_FETCH = 500;

export const MIN_REMINDER_INTERVAL = 5;
export const WAKE_INTERVAL = 10 * 60 * 1000;
export const MESSAGE_PREVIEW_LENGTH = 50;

export const YT_PLAYLIST_PAGE_SIZE = 50;
export const MAX_YT_PLAYLIST_PAGE_FETCHES = 4;

export const MOVIE_DATABASE_API_ROOT = 'https://www.omdbapi.com';

export const SPOTIFY_API_ROOT = 'https://api.spotify.com/v1';
export const SPOTIFY_ABLUMS_FETCH_SIZE = 20;
export const SPOTIFY_PAGE_SIZE = 50;
export const MAX_SPOTIFY_PAGE_FETCHES = 4;

export const MAX_QUEUE_LENGTH = 300;
export const QUEUE_SNIPPET_LENGTH = 10;

export const CONCURRENCY_LIMIT = 10;

export const SUPPRESS_MESSAGE_FLAG = 4096;

export const ENV_LIMITER_SPLIT_REGEX = /,\s*/;

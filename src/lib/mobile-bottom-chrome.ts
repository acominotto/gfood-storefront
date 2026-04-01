/**
 * Height reserved for the fixed mobile bottom nav (excluding safe-area inset).
 * Keep in sync with padding in {@link MobileBottomBar} (icon + label + vertical padding).
 */
export const MOBILE_BOTTOM_NAV_HEIGHT = "5.5rem";

/** Main content bottom padding: clears the mobile nav + safe area. */
export const MOBILE_MAIN_PADDING_BOTTOM = `calc(1.25rem + ${MOBILE_BOTTOM_NAV_HEIGHT} + env(safe-area-inset-bottom, 0px))`;

/** Offset for floating UI (e.g. catalog pager) above the mobile nav. */
export const MOBILE_FLOAT_ABOVE_NAV_BOTTOM = `calc(1rem + ${MOBILE_BOTTOM_NAV_HEIGHT} + env(safe-area-inset-bottom, 0px))`;

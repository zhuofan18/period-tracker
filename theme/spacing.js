// Shared spacing/radius scale — keeps density consistent across screens.
export const space = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  28,
  xxxl: 36,
};

export const radius = {
  sm:   10,
  md:   14,
  lg:   18,
  xl:   22,
  xxl:  28,
  pill: 999,
};

// Single shared shadow — soft and shallow, used instead of ad-hoc
// shadow values so cards read as one consistent elevation system.
export const shadow = {
  web:     { boxShadow: '0 4px 16px rgba(43, 30, 45, 0.06)' },
  default: {
    shadowColor: '#2B1E2D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
};

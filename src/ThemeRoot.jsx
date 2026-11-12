import { themeToStyle } from './theme.js';

export function ThemeRoot({ theme, children }) {
  return (
    <div className="pagelet" style={themeToStyle(theme)}>
      {children}
    </div>
  );
}

import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';
import { sfx } from '../../audio/sfx';

export function Button({ className = '', type = 'button', onClick, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`vgui-btn ${className}`}
      onClick={(e) => {
        sfx.click();
        onClick?.(e);
      }}
      {...rest}
    />
  );
}

/** A link that looks like a VGUI button. External links open in a new tab. */
export function LinkButton({ className = '', onClick, href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const external = /^https?:/.test(href);
  return (
    <a
      href={href}
      className={`vgui-btn ${className}`}
      onClick={(e) => {
        sfx.click();
        onClick?.(e);
      }}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      {...rest}
    />
  );
}

/**
 * Button primitive.
 *
 * Renders a real `<button>` with an explicit `type` (never an implicit submit),
 * enforces icon-only labelling at the type level (an `iconOnly` button must have
 * an `aria-label`), and exposes variants through CSS custom properties rather
 * than class-name soup.
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

interface BaseProps {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  /** Icon rendered after the label. */
  trailingIcon?: IconName;
  children?: ReactNode;
  block?: boolean;
}

type LabelledProps = BaseProps & {
  iconOnly?: false;
  'aria-label'?: string;
};

type IconOnlyProps = BaseProps & {
  iconOnly: true;
  icon: IconName;
  'aria-label': string;
};

export type ButtonProps = (LabelledProps | IconOnlyProps) &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'button--primary',
  secondary: '',
  ghost: 'button--ghost',
  danger: 'button--danger',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  trailingIcon,
  iconOnly,
  block,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps): JSX.Element {
  const classes = [
    'button',
    VARIANT_CLASS[variant],
    size === 'sm' ? 'button--sm' : '',
    iconOnly ? 'button--icon' : '',
    block ? 'button--block' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} {...rest}>
      {icon ? <Icon name={icon} size={size === 'sm' ? 15 : 16} /> : null}
      {iconOnly ? null : children}
      {trailingIcon ? <Icon name={trailingIcon} size={size === 'sm' ? 15 : 16} /> : null}
    </button>
  );
}

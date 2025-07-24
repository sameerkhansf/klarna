import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getThemeColor, getThemeGradient } from '@/styles/theme';

// Themed Button Component
interface ThemedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

export const ThemedButton: React.FC<ThemedButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '',
  style,
  ...props 
}) => {
  const getButtonStyles = () => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg';
    
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };

    const variantStyles = {
      primary: 'text-white hover:opacity-90',
      outline: 'border-2 hover:bg-orange-50 text-white',
      ghost: 'hover:bg-orange-50'
    };

    return `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`;
  };

  const getButtonStyle = () => {
    const baseStyle = { ...style };
    
    if (variant === 'primary') {
      baseStyle.background = getThemeGradient('primary');
    } else if (variant === 'outline') {
      baseStyle.background = getThemeGradient('primary');
      baseStyle.borderColor = getThemeColor('primary.DEFAULT');
    } else if (variant === 'ghost') {
      baseStyle.color = getThemeColor('primary.DEFAULT');
    }
    
    return baseStyle;
  };

  return (
    <button 
      className={getButtonStyles()} 
      style={getButtonStyle()}
      {...props}
    >
      {children}
    </button>
  );
};

// Themed Icon Component
interface ThemedIconProps {
  children: React.ReactElement;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ThemedIcon: React.FC<ThemedIconProps> = ({ 
  children, 
  color = 'primary',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const iconColor = getThemeColor(`${color}.DEFAULT`);
  
  // Don't apply theme color if className contains text color classes
  const hasTextColor = className.includes('text-');
  const style = hasTextColor ? children.props.style : { color: iconColor, ...children.props.style };

  return React.cloneElement(children, {
    className: `${sizeClasses[size]} ${className}`,
    style: style
  });
};

// Themed Loading Component
interface ThemedLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ThemedLoading: React.FC<ThemedLoadingProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-8 w-8'
  };

  return (
    <div 
      className={`animate-spin rounded-full border-2 border-t-transparent ${sizeClasses[size]} ${className}`}
      style={{ borderColor: `${getThemeColor('primary.200')} transparent ${getThemeColor('primary.200')} ${getThemeColor('primary.200')}` }}
    />
  );
};

// Themed Card Component
interface ThemedCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'highlighted' | 'success' | 'warning' | 'error';
  className?: string;
}

export const ThemedCard: React.FC<ThemedCardProps> = ({ 
  children, 
  variant = 'default',
  className = ''
}) => {
  const getCardStyles = () => {
    const baseStyles = 'rounded-lg border p-4';
    
    const variantStyles = {
      default: 'bg-white border-gray-200',
      highlighted: 'border-2',
      success: 'bg-green-50 border-green-200',
      warning: 'bg-yellow-50 border-yellow-200',
      error: 'bg-red-50 border-red-200'
    };

    return `${baseStyles} ${variantStyles[variant]} ${className}`;
  };

  const getCardStyle = () => {
    if (variant === 'highlighted') {
      return {
        background: getThemeGradient('primaryLight'),
        borderColor: getThemeColor('primary.200')
      };
    }
    return {};
  };

  return (
    <div className={getCardStyles()} style={getCardStyle()}>
      {children}
    </div>
  );
};

// Themed Tab Component
interface ThemedTabProps {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

export const ThemedTab: React.FC<ThemedTabProps> = ({ 
  isActive, 
  onClick, 
  children, 
  className = '' 
}) => {
  const tabStyles = `flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
    isActive 
      ? 'bg-white shadow-sm text-white' 
      : 'text-gray-600 hover:text-gray-900'
  } ${className}`;

  const tabStyle = isActive ? {
    background: getThemeGradient('primary'),
    color: 'white'
  } : {};

  return (
    <button 
      className={tabStyles} 
      onClick={onClick}
      style={tabStyle}
    >
      {children}
    </button>
  );
};
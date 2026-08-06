import React, { ReactNode, CSSProperties } from 'react';

export interface ContainerProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

/**
 * A centralized, shared Container component that serves as the outer wrapping box 
 * for every page's main content across the application.
 */
export const Container: React.FC<ContainerProps> = ({ children, style, className = '' }) => {
  return (
    <div
      className={`speedex-container ${className}`}
      style={{
        background: '#ffffff',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '0 4px 24px rgba(15,23,42,0.04)',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...style
      }}
    >
      {children}
    </div>
  );
};

export default Container;

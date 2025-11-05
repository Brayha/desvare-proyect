import React, { useRef, useEffect } from 'react';
import './OTPInput.css';

/**
 * Componente OTPInput para códigos de 4 dígitos
 * Features:
 * - Auto-focus en primer input
 * - Auto-avance al siguiente input
 * - Retroceso con backspace
 * - Soporte para pegar código completo
 * - Animación shake en error
 * 
 * @param {string} value - Valor del OTP (4 dígitos)
 * @param {function} onChange - Callback cuando cambia el valor
 * @param {string} error - Mensaje de error (opcional)
 * @param {boolean} autoFocus - Auto-focus en primer input (default: true)
 */
const OTPInput = ({ value, onChange, error, autoFocus = true }) => {
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  
  // Auto-focus en el primer input
  useEffect(() => {
    if (autoFocus && inputRefs[0].current) {
      inputRefs[0].current.focus();
    }
  }, [autoFocus]);

  const handleChange = (index, e) => {
    const newValue = e.target.value;
    
    // Solo permitir números
    if (newValue && !/^\d$/.test(newValue)) {
      return;
    }
    
    // Actualizar el valor
    const digits = value.split('');
    digits[index] = newValue || '';
    const newOtp = digits.join('');
    onChange(newOtp);
    
    // Auto-avanzar al siguiente input
    if (newValue && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Retroceder con backspace
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pastedData) {
      onChange(pastedData);
      // Focus en el último dígito o siguiente vacío
      const nextIndex = Math.min(pastedData.length, 3);
      inputRefs[nextIndex].current?.focus();
    }
  };

  const digits = value.padEnd(4, ' ').split('');

  return (
    <div className="otp-input-wrapper">
      <div className="otp-input-container">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={inputRefs[index]}
            type="tel"
            inputMode="numeric"
            maxLength={1}
            value={digit.trim()}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={`otp-input-box ${error ? 'otp-input-error' : ''}`}
          />
        ))}
      </div>
      {error && (
        <div className="otp-error-message">
          {error}
        </div>
      )}
    </div>
  );
};

export { OTPInput };
export default OTPInput;


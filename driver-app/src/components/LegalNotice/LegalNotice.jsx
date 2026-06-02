import './LegalNotice.css';

/**
 * Aviso legal con enlaces a Términos y Privacidad (requisito Play Store / App Store).
 */
const LegalNotice = ({ className = '' }) => (
  <p className={`legal-notice ${className}`.trim()}>
    Al continuar aceptas nuestros{' '}
    <a href="/terms">Términos y Condiciones</a>
    {' '}y la{' '}
    <a href="/privacy">Política de Privacidad</a>.
  </p>
);

export default LegalNotice;

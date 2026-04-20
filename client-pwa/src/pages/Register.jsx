import { Redirect } from 'react-router-dom';

/**
 * El registro ya no es un flujo separado.
 * El nuevo modelo unificado (teléfono → PIN) detecta automáticamente
 * si el usuario es nuevo y lo guía por el proceso de registro.
 * Redirigimos a /login donde vive ese flujo.
 */
const Register = () => <Redirect to="/login" />;

export default Register;

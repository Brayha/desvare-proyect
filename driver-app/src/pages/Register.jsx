import { Redirect } from 'react-router-dom';

/**
 * El registro de conductores ahora ocurre dentro del flujo unificado
 * de LoginOTP.jsx (ingresa número → si no existe → crear cuenta).
 */
const Register = () => <Redirect to="/login" />;

export default Register;

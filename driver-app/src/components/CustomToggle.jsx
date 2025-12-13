import './CustomToggle.css';

const CustomToggle = ({ isActive, onToggle }) => {
  return (
    <div className="custom-toggle">
      <div
        className={`toggle-option ${!isActive ? 'active' : ''}`}
        onClick={() => onToggle(false)}
      >
        Ocupado
      </div>
      <div
        className={`toggle-option ${isActive ? 'active' : ''}`}
        onClick={() => onToggle(true)}
      >
        Activo
      </div>
      <div className={`toggle-slider ${isActive ? 'right' : 'left'}`} />
    </div>
  );
};

export default CustomToggle;

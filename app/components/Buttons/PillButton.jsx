// import './pill-button.css';

export default function PillButton({ children }) {
    return (
        <button className="pill-button">
            <span className="pill-button__text">
                {children}
            </span>
        </button>
    );
}
// import './pill-button.css';

export default function PillButton({ children, ...props }) {
    return (
        <button className="pill-button" {...props}>
            <span className="pill-button__text">
                {children}
            </span>
        </button>
    );
}
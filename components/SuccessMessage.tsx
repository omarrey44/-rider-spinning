import { CheckIcon } from './Icons';

interface SuccessMessageProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
}

export default function SuccessMessage({
  title,
  subtitle,
  icon = <CheckIcon size={20} />,
}: SuccessMessageProps) {
  return (
    <div className="success-message" role="status">
      <span className="success-icon">{icon}</span>
      <div>
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
    </div>
  );
}

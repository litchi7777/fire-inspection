import { ArrowLeft } from 'lucide-react';
import { ReactNode } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  rightContent?: ReactNode;
}

export const Header = ({
  title,
  subtitle,
  onBack,
  backLabel = '戻る',
  rightContent,
}: HeaderProps): JSX.Element => {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{backLabel}</span>
          </button>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
          {rightContent && <div>{rightContent}</div>}
        </div>
      </div>
    </header>
  );
};

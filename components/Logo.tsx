import Image from 'next/image';

interface LogoProps {
    variant?: 'full' | 'icon';
    className?: string;
    width?: number;
    height?: number;
}

export const Logo = ({ variant = 'full', className = '', width, height }: LogoProps) => {
    const src = variant === 'full' ? '/logo.svg' : '/icon.svg';
    const defaultWidth = variant === 'full' ? 140 : 40;
    const defaultHeight = variant === 'full' ? 35 : 40;

    return (
        <div className={`relative ${className}`} style={{ width: width || defaultWidth, height: height || defaultHeight }}>
            <Image
                src={src}
                alt="PreOrder Dulu Logo"
                fill
                className="object-contain"
                priority
            />
        </div>
    );
};

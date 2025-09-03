import logoImg from "@assets/logo.png";

interface LogoProps {
  className?: string;
  alt?: string;
}

export const Logo = ({
  className = "",
  alt = "Easygenerator logo",
}: LogoProps) => {
  return (
    <img
      src={logoImg}
      alt={alt}
      className={`h-8 w-auto sm:h-12 ${className}`}
    />
  );
};

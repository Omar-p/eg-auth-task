import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      duration={4000}
      style={
        {
          "--normal-bg": "hsl(0 0% 100%)",
          "--normal-text": "hsl(222.2 84% 4.9%)",
          "--normal-border": "hsl(214.3 31.8% 91.4%)",
        } as React.CSSProperties
      }
      toastOptions={{
        style: {
          background: "white",
          color: "hsl(222.2 84% 4.9%)",
          border: "1px solid hsl(214.3 31.8% 91.4%)",
        },
        className: "group toast group-[.toaster]:text-foreground",
        descriptionClassName:
          "group-[.toast]:text-muted-foreground group-[.toast]:text-gray-700",
      }}
      {...props}
    />
  );
};

export { Toaster };

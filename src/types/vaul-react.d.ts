declare module "vaul-react" {
  export const Drawer: {
    Root: React.FC<{
      open?: boolean;
      onOpenChange?: (open: boolean) => void;
      children?: React.ReactNode;
    }>;
    Portal: React.FC<{
      children?: React.ReactNode;
    }>;
    Content: React.FC<{
      children?: React.ReactNode;
      className?: string;
    }>;
    Overlay: React.FC<{
      className?: string;
    }>;
  };
}

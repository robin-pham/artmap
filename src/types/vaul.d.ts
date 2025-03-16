declare module "vaul" {
  export const Drawer: {
    Root: React.FC<{
      open?: boolean;
      onOpenChange?: (open: boolean) => void;
      children?: React.ReactNode;
      snapPoints?: string[];
      activeSnapPoint?: string | number | null;
      setActiveSnapPoint?: (point: string | number | null) => void;
      modal?: boolean;
      dismissible?: boolean;
      defaultOpen?: boolean;
    }>;
    Portal: React.FC<{
      children?: React.ReactNode;
    }>;
    Content: React.FC<{
      children?: React.ReactNode;
      className?: string;
    }>;
    Handle: React.FC<{
      className?: string;
    }>;
  };
}

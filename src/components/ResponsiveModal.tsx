import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  showHeader?: boolean; // Whether to show the default header structure
}

const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
};

const ResponsiveModal = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  showHeader = true,
}: ResponsiveModalProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent
          className={cn(
            "max-h-[90vh] min-h-[50vh]",
            className
          )}
        >
          {/* Creative drag indicator - two hearts */}
          <div className="mx-auto mt-3 flex items-center gap-2">
            <Heart className="w-3 h-3 fill-primary/30 text-primary/30" />
            <div className="h-1.5 w-12 rounded-full bg-gradient-to-r from-primary/40 via-accent/40 to-primary/40" />
            <Heart className="w-3 h-3 fill-accent/30 text-accent/30" />
          </div>

          {showHeader && title && (
            <DrawerHeader className="text-left">
              <DrawerTitle>{title}</DrawerTitle>
              {description && <DrawerDescription>{description}</DrawerDescription>}
            </DrawerHeader>
          )}

          <div className={cn("overflow-y-auto", showHeader && "px-4 pb-4")}>
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        {showHeader && title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default ResponsiveModal;

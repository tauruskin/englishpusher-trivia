import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

export interface MenuItem {
  label: string;
  description?: string;
  color?: string;
  onClick: () => void;
}

interface MenuVerticalProps {
  items: MenuItem[];
  title?: string;
  subtitle?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: -16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export function MenuVertical({ items, title, subtitle }: MenuVerticalProps) {
  return (
    <div className="flex flex-col items-center gap-8 w-full">
      {(title || subtitle) && (
        <motion.div
          variants={headerVariants}
          initial="hidden"
          animate="visible"
          className="text-center space-y-2"
        >
          {title && (
            <h2 className="font-display text-3xl font-bold text-foreground tracking-tight">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="font-body text-muted-foreground text-base">{subtitle}</p>
          )}
        </motion.div>
      )}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full flex flex-col gap-3"
      >
        {items.map((item, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <button
              onClick={item.onClick}
              className="w-full flex items-center justify-between p-5 rounded-2xl bg-card border-2 border-border hover:border-primary/60 text-left transition-colors group shadow-sm"
              style={{
                borderLeftColor: item.color ?? "#f07c1a",
                borderLeftWidth: "4px",
              }}
            >
              <div className="min-w-0">
                <span className="font-display font-semibold text-foreground text-lg group-hover:text-primary transition-colors block">
                  {item.label}
                </span>
                {item.description && (
                  <span className="font-body text-sm text-muted-foreground mt-0.5 block">
                    {item.description}
                  </span>
                )}
              </div>
              <motion.span
                className="text-muted-foreground group-hover:text-primary transition-colors ml-4 flex-shrink-0"
                initial={false}
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <ArrowRight size={20} />
              </motion.span>
            </button>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

export default MenuVertical;

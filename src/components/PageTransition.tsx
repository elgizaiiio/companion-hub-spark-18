import { ReactNode } from "react";
import { motion } from "framer-motion";

const PageTransition = ({ children }: { children: ReactNode }) => (
  <motion.div
    className="min-h-screen bg-transparent"
    initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    exit={{ opacity: 0, y: -5, filter: "blur(4px)" }}
    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

export default PageTransition;
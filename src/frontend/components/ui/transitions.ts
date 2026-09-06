import { Transition, Variants } from "framer-motion";

export const springTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 25,
};

export const snappyTransition: Transition = {
  type: "spring",
  stiffness: 450,
  damping: 30,
};

export const smoothTransition: Transition = {
  duration: 0.3,
  ease: [0.25, 0.1, 0.25, 1.0],
};

export const fadeInUpVariants: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: springTransition,
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: smoothTransition,
  },
};

export const slideUpVariants: Variants = {
  initial: { y: "100%", opacity: 0.5 },
  animate: {
    y: 0,
    opacity: 1,
    transition: springTransition,
  },
  exit: {
    y: "100%",
    opacity: 0,
    transition: { duration: 0.25, ease: "easeInOut" },
  },
};

export const transitions = {
  spring: springTransition,
  snappy: snappyTransition,
  smooth: smoothTransition,
  fadeInUp: fadeInUpVariants,
  slideUp: slideUpVariants,
};

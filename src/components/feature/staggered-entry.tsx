"use client";

import * as React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StaggeredEntryProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const childVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: 'spring',
            damping: 15,
            stiffness: 100,
        },
    },
};

export default function StaggeredEntry({ children, className, ...rest }: StaggeredEntryProps) {
    const childrenArray = React.Children.toArray(children);

    return (
        <motion.div
            className={cn(className)}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            {...rest}
        >
            {childrenArray.map((child, i) => (
                <motion.div key={i} variants={childVariants}>
                    {child}
                </motion.div>
            ))}
        </motion.div>
    );
}

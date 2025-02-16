"use client";
import { FileCode, Box, Cable, ScrollText, SquareTerminal } from "lucide-react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { SidebarToggle } from "@/components/ui/sidebar-toggle";
import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function BentoGridThirdDemo() {
  return (
    <BentoGrid className="mx-auto max-w-4xl md:auto-rows-[20rem]">
      {items.map((item, i) => (
        <BentoGridItem
          key={i}
          title={item.title}
          description={item.description}
          href={item.link}
          header={item.header}
          className={cn("[&>p:text-lg]", item.className)}
          icon={item.icon}
        />
      ))}
    </BentoGrid>
  );
}

type APIMethod = {
  type: "GET" | "POST" | "PUT" | "DELETE";
  color: string;
  progressColor: string;
  dotColor: string;
};

const API_METHODS: Record<string, APIMethod> = {
  GET: {
    type: "GET",
    color: "bg-green-500/20 text-green-700 dark:text-green-300",
    progressColor: "bg-green-500/50",
    dotColor: "bg-green-500",
  },
  POST: {
    type: "POST",
    color: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
    progressColor: "bg-blue-500/50",
    dotColor: "bg-blue-500",
  },
  PUT: {
    type: "PUT",
    color: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300",
    progressColor: "bg-yellow-500/50",
    dotColor: "bg-yellow-500",
  },
  DELETE: {
    type: "DELETE",
    color: "bg-red-500/20 text-red-700 dark:text-red-300",
    progressColor: "bg-red-500/50",
    dotColor: "bg-red-500",
  },
};

const APIDocumentation = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isForbidden, setIsForbidden] = useState(false);
  const [method, setMethod] = useState<APIMethod>(API_METHODS.GET);

  useEffect(() => {
    const methods = Object.values(API_METHODS);
    const randomMethod = methods[Math.floor(Math.random() * methods.length)];
    setMethod(randomMethod);
    setIsForbidden(Math.random() < 0.05);
  }, []);

  const steps = useMemo(
    () => [
      { method: method.type, status: "Sending request..." },
      { method: method.type, status: "Processing..." },
      { method: method.type, status: isForbidden ? "403 Forbidden" : "200 OK" },
    ],
    [method.type, isForbidden],
  );

  const handleHoverStart = () => {
    setIsAnimating(true);
    setCurrentStep(0);
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= 2) {
          clearInterval(interval);
          return 2;
        }
        return prev + 1;
      });
    }, 400);
  };

  const handleHoverEnd = () => {
    setIsAnimating(false);
    setCurrentStep(0);
  };

  return (
    <motion.div
      initial="initial"
      whileHover="hover"
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      className="bg-dot-black/[0.2] dark:bg-dot-white/[0.2] flex h-full min-h-[6rem] w-full flex-1 flex-col space-y-2"
    >
      <motion.div className="flex flex-col space-y-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-white/[0.2] dark:bg-black">
        {/* Method and Endpoint */}
        <div className="flex items-center space-x-2">
          <motion.span
            className={`px-2 py-1 ${method.color} rounded-md font-mono text-xs`}
            animate={
              isAnimating
                ? {
                    opacity: [1, 0.5, 1],
                    transition: { duration: 1.2, repeat: Infinity },
                  }
                : {}
            }
          >
            {steps[currentStep].method}
          </motion.span>
          <code className="font-mono text-sm text-neutral-600 dark:text-neutral-200">
            /api/v1/users
          </code>
        </div>

        {/* Loading Bar */}
        <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          <motion.div
            className={`h-full rounded-full ${
              isForbidden && currentStep === 2 ? "bg-red-500/50" : method.progressColor
            }`}
            initial={{ width: "0%" }}
            animate={
              isAnimating
                ? {
                    width: ["0%", "30%", "60%", "100%"],
                    transition: { duration: 1.2, ease: "easeInOut" },
                  }
                : { width: "0%" }
            }
          />
        </div>

        {/* Status */}
        <motion.div
          className="flex items-center space-x-2"
          animate={
            isAnimating
              ? {
                  y: [0, -20, 0],
                  transition: { duration: 0.3, times: [0, 0.5, 1] },
                }
              : {}
          }
        >
          <div
            className={`h-2 w-2 rounded-full ${
              isForbidden && currentStep === 2 ? "bg-red-500" : method.dotColor
            }`}
          />
          <div
            className={`text-xs font-medium ${
              isForbidden && currentStep === 2
                ? "text-red-700 dark:text-red-300"
                : "text-neutral-700 dark:text-neutral-300"
            }`}
          >
            {steps[currentStep].status}
          </div>
        </motion.div>

        {/* Response Preview */}
        <motion.div
          className="space-y-2 overflow-hidden"
          animate={
            currentStep === 2
              ? {
                  height: "auto",
                  opacity: 1,
                }
              : {
                  height: 0,
                  opacity: 0,
                }
          }
          transition={{ duration: 0.2 }}
        >
          {isForbidden ? (
            <div className="font-mono text-xs text-red-500">
              {"{ error: 'You shall not pass! 🧙‍♂️' }"}
            </div>
          ) : (
            <>
              <div className="h-2 w-3/4 rounded bg-neutral-100 dark:bg-neutral-800" />
              <div className="h-2 w-1/2 rounded bg-neutral-100 dark:bg-neutral-800" />
              <div className="h-2 w-2/3 rounded bg-neutral-100 dark:bg-neutral-800" />
            </>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

const SDKShowcase = () => {
  const languages = [
    {
      name: "JavaScript",
      color: "text-yellow-500/40 hover:text-yellow-500",
      icon: "{ }",
      code: ["import { Mail } from '@mail/sdk'", "const mail = new Mail({", "  key: '***'", "})"],
    },
    {
      name: "Python",
      color: "text-blue-500/40 hover:text-blue-500",
      icon: "🐍",
      code: ["from mail0 import Mail0", "mail = Mail0(", "  key='***'", ")"],
    },
    {
      name: "Ruby",
      color: "text-red-500/40 hover:text-red-500",
      icon: "💎",
      code: ["require 'mail0'", "mail = Mail0::Mail.new(", "  key: '***'", ")"],
    },
    {
      name: "Go",
      color: "text-cyan-500/40 hover:text-cyan-500",
      icon: "🔷",
      code: [
        `package main`,
        "import (",
        '  mail0 "mail0"',
        ")",
        "func main() {",
        "  mail := mail0.New(",
        '    key: "***",',
        "  )",
        "}",
      ],
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isHovered) return;
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % languages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <motion.div
      initial="initial"
      whileHover="hover"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="bg-dot-black/[0.2] dark:bg-dot-white/[0.2] flex h-full min-h-[6rem] w-full flex-1 flex-col space-y-2"
    >
      <motion.div
        className="flex h-full flex-col rounded-lg border border-neutral-200 bg-white p-3 dark:border-white/[0.2] dark:bg-black"
        animate={
          isHovered
            ? {
                scale: 1,
                transition: { duration: 0.2 },
              }
            : {
                scale: 0.98,
                transition: { duration: 0.2 },
              }
        }
      >
        {/* Header */}
        <div className="mb-2 flex items-center justify-between">
          <motion.span
            className="rounded-full bg-neutral-100/50 px-1.5 py-0.5 font-mono text-[10px] text-neutral-500/70 transition-colors duration-200 group-hover:bg-green-500/20 group-hover:text-green-700 dark:bg-neutral-800/50 dark:text-neutral-400/70 dark:group-hover:bg-green-500/20 dark:group-hover:text-green-300"
            animate={
              isHovered
                ? {
                    transition: { duration: 0.2 },
                  }
                : {}
            }
          >
            v2.1.0
          </motion.span>
          <div className="flex items-center space-x-1.5">
            <motion.span
              className={`text-sm transition-colors duration-200 ${languages[activeIndex].color}`}
              animate={isHovered ? { scale: [1, 1.1, 1] } : {}}
            >
              {languages[activeIndex].icon}
            </motion.span>
            <span className="text-[10px] text-neutral-500/70 transition-colors duration-200 group-hover:text-neutral-500">
              {languages[activeIndex].name}
            </span>
          </div>
        </div>

        {/* Code Preview */}
        <motion.div
          className="overflow-hidden rounded-md bg-neutral-50/50 p-2 font-mono text-[10px] transition-colors duration-200 group-hover:bg-neutral-50 dark:bg-neutral-900/50 dark:group-hover:bg-neutral-900"
          animate={
            isHovered
              ? {
                  opacity: [0.5, 1],
                  y: [5, 0],
                  transition: { duration: 0.15 },
                }
              : {}
          }
          key={activeIndex}
        >
          {/* Real Code */}
          <div className="mb-1 text-neutral-600/70 transition-colors duration-200 group-hover:text-neutral-600 dark:text-neutral-400/70 dark:group-hover:text-neutral-400">
            {languages[activeIndex].code[0]}
          </div>

          {/* Config with Skeleton */}
          <div className="text-neutral-500/70 transition-colors duration-200 group-hover:text-neutral-500 dark:text-neutral-500/70">
            {languages[activeIndex].code[1]}
          </div>
          <div className="ml-2 text-neutral-400/70 transition-colors duration-200 group-hover:text-neutral-400 dark:text-neutral-600/70 dark:group-hover:text-neutral-600">
            {languages[activeIndex].code[2]}
          </div>
          <div className="text-neutral-500/70 transition-colors duration-200 group-hover:text-neutral-500 dark:text-neutral-500/70">
            {languages[activeIndex].code[3]}
          </div>

          {/* Skeleton Lines */}
          <div className="mt-1 space-y-1">
            <motion.div
              className="h-1 w-16 rounded bg-neutral-200/50 dark:bg-neutral-800/50"
              animate={
                isHovered
                  ? {
                      opacity: [0.5, 0.8],
                      transition: { duration: 1, repeat: Infinity },
                    }
                  : {}
              }
            />
            <motion.div
              className="h-1 w-24 rounded bg-neutral-200/50 dark:bg-neutral-800/50"
              animate={
                isHovered
                  ? {
                      opacity: [0.5, 0.8],
                      transition: { duration: 1, repeat: Infinity, delay: 0.2 },
                    }
                  : {}
              }
            />
          </div>
        </motion.div>

        {/* Language Dots */}
        <div className="mt-2 flex justify-center space-x-1">
          {languages.map((_, index) => (
            <motion.div
              key={index}
              className={`h-1 w-1 rounded-full transition-colors duration-200 ${
                index === activeIndex
                  ? isHovered
                    ? "bg-neutral-800 dark:bg-white"
                    : "bg-neutral-400 dark:bg-neutral-500"
                  : "bg-neutral-300/50 dark:bg-neutral-700/50"
              }`}
              animate={
                isHovered && index === activeIndex
                  ? {
                      scale: [1, 1.2, 1],
                      transition: { duration: 0.3 },
                    }
                  : {}
              }
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

const Webhooks = () => {
  const pulseVariants = {
    initial: {
      scale: 1,
      opacity: 0.5,
    },
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="bg-dot-black/[0.2] dark:bg-dot-white/[0.2] flex h-full min-h-[6rem] w-full flex-1 p-4"
    >
      <div className="w-full space-y-4">
        {[
          { event: "user.created", status: "success" },
          { event: "payment.processed", status: "pending" },
          { event: "data.updated", status: "success" },
        ].map((webhook, i) => (
          <motion.div
            key={webhook.event}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3 dark:border-white/[0.2] dark:bg-black"
          >
            <div className="flex items-center space-x-2">
              <motion.div
                initial="initial"
                animate="animate"
                variants={pulseVariants}
                className={`h-2 w-2 rounded-full ${
                  webhook.status === "success" ? "bg-green-500" : "bg-yellow-500"
                }`}
              />
              <span className="font-mono text-xs text-neutral-600 dark:text-neutral-200">
                {webhook.event}
              </span>
            </div>
            <div
              className={`rounded-full px-2 py-1 text-xs ${
                webhook.status === "success"
                  ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                  : "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30"
              }`}
            >
              {webhook.status}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

const Contributing = () => {
  const first = {
    initial: { x: 20, rotate: -5 },
    hover: { x: 0, rotate: 0 },
  };
  const second = {
    initial: { x: -20, rotate: 5 },
    hover: { x: 0, rotate: 0 },
  };

  const contributors = [
    {
      avatar: "https://avatars.githubusercontent.com/u/75869731?v=4",
      action: "Reached 100 contributions",
      badge: "Core Contributor",
      badgeColor: {
        bg: "bg-green-100 dark:bg-green-900/20",
        border: "border-green-500",
        text: "text-green-600 dark:text-green-400",
      },
    },
    {
      avatar: "https://avatars.githubusercontent.com/u/171995053?v=4",
      action: "Broke the code.",
      badge: "Prod pusher",
      badgeColor: {
        bg: "bg-red-100 dark:bg-red-900/20",
        border: "border-red-500",
        text: "text-red-600 dark:text-red-400",
      },
    },
    {
      avatar: "https://avatars.githubusercontent.com/u/111918348?v=4",
      action: "Added new SDK feature",
      badge: "SDK Team",
      badgeColor: {
        bg: "bg-blue-100 dark:bg-blue-900/20",
        border: "border-blue-500",
        text: "text-blue-600 dark:text-blue-400",
      },
    },
  ];

  return (
    <motion.div
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="bg-dot-black/[0.2] dark:bg-dot-white/[0.2] flex h-full min-h-[6rem] w-full flex-1 flex-row space-x-2"
    >
      {contributors.map((contributor, index) => (
        <motion.div
          key={index}
          variants={index === 0 ? first : index === 2 ? second : {}}
          className={`h-full ${index === 1 ? "relative z-20" : ""} flex w-1/3 flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/[0.1] dark:bg-black`}
        >
          <Image
            src={contributor.avatar}
            alt="contributor avatar"
            height="100"
            width="100"
            className="h-10 w-10 rounded-full"
          />
          <p className="mt-4 text-center text-xs font-semibold text-neutral-500 sm:text-sm">
            {contributor.action}
          </p>
          <p
            className={`border ${contributor.badgeColor.border} ${contributor.badgeColor.bg} ${contributor.badgeColor.text} mt-4 rounded-full px-2 py-0.5 text-xs`}
          >
            {contributor.badge}
          </p>
        </motion.div>
      ))}
    </motion.div>
  );
};

const CLI = () => {
  const [text, setText] = useState("pnpm install @mail0/cli");
  const [isAnimating, setIsAnimating] = useState(false);
  const fullText = "pnpm install @mail0/cli";

  const typewriterVariants = {
    initial: {
      width: "100%",
    },
    hover: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cursorVariants = {
    initial: {
      opacity: 0,
    },
    hover: {
      opacity: [0, 1, 0],
      transition: {
        duration: 0.8,
        repeat: Infinity,
      },
    },
  };

  const handleHover = () => {
    if (isAnimating) return; // Prevent restart if animation is in progress

    setIsAnimating(true);
    setText("");
    let i = 0;
    const interval = setInterval(() => {
      if (i <= fullText.length) {
        setText(fullText.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
        setIsAnimating(false); // Animation is complete
      }
    }, 100);
  };

  return (
    <motion.div
      initial="initial"
      whileHover="hover"
      className="bg-dot-black/[0.2] dark:bg-dot-white/[0.2] flex h-full min-h-[6rem] w-full flex-1 p-2"
    >
      <div className="w-full space-y-3">
        <div className="flex items-center space-x-2 font-mono text-sm">
          <span className="text-green-500">$</span>
          <motion.div
            variants={typewriterVariants}
            className="relative flex h-6 items-center rounded bg-neutral-100 px-2 dark:bg-neutral-800"
          >
            <motion.div
              initial="initial"
              whileHover="hover"
              animate="hover"
              onHoverStart={handleHover}
              className="text-neutral-500 dark:text-neutral-300"
            >
              {text}
              <motion.span
                variants={cursorVariants}
                className="ml-[1px] inline-block h-4 w-[2px] bg-neutral-500 dark:bg-neutral-300"
              />
            </motion.div>
          </motion.div>
        </div>
        <div className="space-y-2">
          {["init", "build", "deploy", "test"].map((cmd) => (
            <motion.div
              key={cmd}
              whileHover={{ x: 5 }}
              className="flex items-center space-x-2 text-xs"
            >
              <span className="text-blue-500">❯</span>
              <span className="font-mono text-neutral-600 dark:text-neutral-300">cli {cmd}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const items = [
  {
    title: "API Documentation",
    description: (
      <span className="text-sm">
        Comprehensive API references, guides, and examples to get you started.
      </span>
    ),
    header: <APIDocumentation />,
    className: "md:col-span-1",
    link: "/mail/under-construction/api",
    icon: <FileCode className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "SDKs & Libraries",
    description: (
      <span className="text-sm">
        Official SDKs and libraries for multiple programming languages.
      </span>
    ),
    header: <SDKShowcase />,
    className: "md:col-span-1",
    link: "/mail/under-construction/sdks",
    icon: <Box className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Webhooks",
    description: (
      <span className="text-sm">
        Real-time event notifications and integrations for your applications.
      </span>
    ),
    header: <Webhooks />,
    className: "md:col-span-1",
    link: "/mail/under-construction/webhooks",
    icon: <Cable className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Contributing",
    description: (
      <span className="text-sm">
        Join our open source community and help shape the future of our platform.
      </span>
    ),
    header: <Contributing />,
    link: "/mail/under-construction/contributing",
    className: "md:col-span-2",
    icon: <ScrollText className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "CLI Tools",
    description: (
      <span className="text-sm">
        Powerful command-line tools for streamlined development workflows.
      </span>
    ),
    header: <CLI />,
    link: "/mail/under-construction/cli",
    className: "md:col-span-1",
    icon: <SquareTerminal className="h-4 w-4 text-neutral-500" />,
  },
];

export default function DeveloperPage() {
  return (
    <div className="relative flex h-full w-full flex-col overflow-x-auto">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-white bg-grid-black/[0.1] dark:bg-black dark:bg-grid-white/[0.1]">
        {/* Radial gradient overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black"></div>
      </div>

      {/* Content */}
      <div className="relative flex h-full w-full flex-col p-4 md:items-center md:justify-center">
        <div className="relative mb-4 flex w-full max-w-4xl flex-row items-center justify-start">
          <div className="absolute left-0">
            <SidebarToggle />
          </div>
          <div className="flex w-full flex-row items-center justify-between rounded-lg border border-neutral-200 bg-white p-4 pt-6 dark:border-white/[0.2] dark:bg-black"></div>
        </div>
        <BentoGridThirdDemo />
      </div>
    </div>
  );
}

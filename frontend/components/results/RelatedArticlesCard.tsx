"use client";

import { motion } from "framer-motion";
import { RelatedArticle } from "@/lib/types";

interface RelatedArticlesCardProps {
  articles: RelatedArticle[];
}

const itemVariants = {
  hidden:  { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.07, duration: 0.28, ease: "easeOut" as const },
  }),
};

export default function RelatedArticlesCard({ articles }: RelatedArticlesCardProps) {
  if (!articles || articles.length === 0) return null;

  return (
    <div className="bg-card border border-hairline rounded-2xl p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted mb-4">
        Also covered by
      </p>

      <ul className="flex flex-col gap-3">
        {articles.map((article, i) => (
          <motion.li
            key={i}
            custom={i}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="group"
          >
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 hover:opacity-80 transition-opacity"
              aria-label={`Read: ${article.title} on ${article.source}`}
            >
              {/* Source badge */}
              <span className="mt-0.5 shrink-0 font-mono text-[10px] uppercase tracking-widest text-muted bg-hairline px-2 py-0.5 rounded-full whitespace-nowrap">
                {article.source || "News"}
              </span>

              {/* Title */}
              <span className="text-xs text-ink leading-snug group-hover:text-muted transition-colors line-clamp-2">
                {article.title}
              </span>

              {/* Arrow */}
              <span className="ml-auto mt-0.5 shrink-0 text-muted text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </span>
            </a>
          </motion.li>
        ))}
      </ul>

      <p className="mt-4 text-[10px] text-muted/60 font-mono">
        Results from Google News · verify independently
      </p>
    </div>
  );
}

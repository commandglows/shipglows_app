import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const skills = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/skills" }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    summary: z.string(),
    category: z.enum([
      "Plan & Decide",
      "Build & Fix",
      "Audit & Improve",
      "Research & Grow",
      "Operate & Ship",
      "Meta & Setup"
    ]),
    audience: z.array(z.string()),
    problem: z.string(),
    outcome: z.string(),
    founder_angle: z.string(),
    when_to_use: z.array(z.string()),
    what_you_give: z.array(z.string()),
    what_you_get: z.array(z.string()),
    example_prompts: z.array(z.string()),
    argument_modes: z
      .array(
        z.object({
          argument: z.string(),
          effect: z.string(),
          consequence: z.string()
        })
      )
      .default([]),
    limits: z.array(z.string()),
    related_skills: z.array(z.string()),
    featured: z.boolean().default(false),
    order: z.number().int().nonnegative()
  })
});

const articles = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/articles" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    summary: z.string(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    locale: z.enum(["en", "fr"]),
    articleKey: z.string(),
    slug: z.string(),
    alternateSlug: z.string(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    readingTime: z.string()
  })
});

export const collections = { skills, articles };

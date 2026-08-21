---
title: "CSS-first: designing interfaces that survive JavaScript"
description: "A practical method for building modern, animated interfaces whose content remains accessible when JavaScript, hydration, or animation fails."
summary: "HTML carries the content, CSS carries the presentation, and JavaScript adds genuinely dynamic capabilities: a simple contract for more resilient interfaces."
publishDate: 2026-08-21
locale: "en"
articleKey: "css-first-resilient-interfaces"
slug: "css-first-designing-interfaces-that-survive-javascript"
alternateSlug: "css-first-concevoir-interfaces-survivent-javascript"
tags:
  - "CSS"
  - "JavaScript"
  - "accessibility"
  - "progressive enhancement"
  - "frontend design"
  - "resilience"
featured: false
draft: true
readingTime: "10 min"
---

A homepage can look flawless in a demo and disappear almost entirely for a real user.

Sometimes all it takes is a blocked script, a hydration error, or an observer that never fires. Headings stay at `opacity: 0`. Sections wait for an animation timeline. The main button exists in the DOM, but nobody can see it.

The problem is not animation. It is not even JavaScript.

The problem is giving an enhancement that can fail control over access to the content.

The rule we should adopt is simple: **JavaScript enhances the experience; it must never hold the content hostage.**

## CSS-first is not a war on JavaScript

“CSS-first” does not mean a modern application should work without a single line of JavaScript. Instant search, collaborative editing, data synchronization, and complex workflows need state and logic.

The principle is about assigning responsibilities:

- HTML describes the content, its structure, and its meaning;
- CSS handles layout, responsive behavior, visual states, themes, transitions, and decorative animation;
- JavaScript steps in when the result genuinely depends on data, application state, complex interaction, coordination, or runtime measurement.

This hierarchy prevents us from asking JavaScript to rebuild what the browser already knows how to present. More importantly, it prevents a failure in the last layer from disabling the first two.

The right question is not, “Can we do this with JavaScript?”

Almost anything can be.

The better question is: **“What functional capability does JavaScript add here?”**

If the answer is only “hide and then reveal a paragraph,” “handle a hover,” or “create a little movement,” HTML and CSS are probably a better foundation.

## The classic trap: hide until ready

The fragile pattern often looks like this:

```css
.reveal {
  opacity: 0;
  transform: translateY(2rem);
}
```

```js
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
    }
  }
});

document.querySelectorAll(".reveal").forEach((element) => {
  observer.observe(element);
});
```

```css
.reveal.is-visible {
  opacity: 1;
  transform: none;
}
```

When everything works, the result is elegant. But the content’s initial state is also its failure state: invisible.

An extension may block the script. An earlier exception may stop initialization. A refactor may remove the expected selector. Client-side navigation may forget to recreate the observer. The page is delivered, the server responds, and the HTML is present—yet the user receives an incomplete screen.

That is not a minor animation defect. It is a failure of content access.

## Design the failure state before the effect

A resilient interface starts from a usable initial state:

```css
.feature {
  opacity: 1;
  transform: none;
}
```

The enhancement can then affect something that is not essential to understanding: a background, border, glow, illustration, or small movement that never makes the text unreadable.

```css
.feature {
  box-shadow: 0 0 0 rgb(120 90 255 / 0%);
  transition: box-shadow 240ms ease, transform 240ms ease;
}

.feature:hover,
.feature:focus-within {
  box-shadow: 0 1rem 3rem rgb(120 90 255 / 18%);
  transform: translateY(-0.2rem);
}
```

Here, the decoration can fail to appear without affecting the message or the primary action.

That distinction is fundamental: **when an animation fails, it should lose its effect—not make the user lose the content.**

This does not forbid every entrance animation. But if the starting state hides an essential section, the effect needs a proven fallback. The most robust answer is often simpler: keep the content visible and animate a secondary property, reduce the movement, or reserve full reveals for purely decorative elements.

## The browser already provides more behavior than we think

Many interfaces recreate primitives in JavaScript that HTML and CSS already provide.

`<details>` and `<summary>` cover disclosures and many accordions. The `popover` attribute controls contextual content with HTML attributes. `<dialog>` provides a semantic foundation for modal dialogs. Media queries respond to theme, contrast, and motion preferences. CSS can produce transitions, animations, and even some scroll-driven effects.

These primitives do not solve every product problem. A complex component may still need state management, business rules, or coordination that native elements cannot express.

But we should check the platform first. MDN shows, for example, that HTML attributes can control a popover and that exclusive accordions can be built from `<details>` elements sharing a `name` attribute ([Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API), [exclusive accordions with `<details>`](https://developer.mozilla.org/en-US/blog/html-details-exclusive-accordions/)).

Every behavior entrusted to the browser is a little less initialization, cleanup, synchronization, and repair code to own.

## Reduced motion is part of the contract

An animation that works technically is not automatically acceptable.

The `prefers-reduced-motion` media query detects a system preference to remove, reduce, or replace non-essential movement. It is widely available in modern browsers ([MDN documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion)).

```css
.card {
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.card:hover {
  transform: translateY(-0.25rem);
}

@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }

  .card:hover {
    transform: none;
  }
}
```

Reduced-motion mode must not become a degraded or confusing state. It should preserve hierarchy, reading, state changes, and useful feedback. We remove unnecessary movement; we do not remove information.

MDN also recommends preferring CSS over JavaScript for DOM animation when appropriate, while limiting unnecessary effects that increase rendering work ([CSS performance optimization](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance/CSS)).

## When JavaScript is the right answer

CSS-first stops being useful as soon as it becomes dogma.

JavaScript is entirely justified when the interface needs to:

- load or synchronize data;
- maintain rich application state;
- coordinate multiple components or events;
- handle a complex interaction absent from native primitives;
- measure the environment’s actual geometry or capabilities;
- orchestrate an animation that communicates a functional relationship CSS cannot express cleanly.

The next question is then: **what is the smallest responsibility JavaScript needs to own?**

The content can remain in HTML. The layout can remain in CSS. JavaScript can focus on loading results, synchronizing state, or adding the required coordination.

This separation improves maintenance. It also contains failure: if remote data does not load, the page can still explain what should have appeared and offer recovery. If an advanced animation fails, the text and actions remain available.

The same division of responsibilities guides our architecture choices. We explain that connection in [our framework selection guide for 2026—and why we chose Astro for websites](/blog/which-framework-choose-2026-why-astro).

## The preflight that actually changes page quality

A successful build does not prove that an interface is resilient. Code can compile perfectly and still leave the page invisible when a script fails to start.

Before delivering a public or critical page, test it in several states:

1. JavaScript works normally;
2. JavaScript is disabled or blocked;
3. animation initialization fails;
4. `prefers-reduced-motion` is active;
5. the page is slow, narrow, or partially loaded.

Ask the same questions in every state:

- Are the title and value proposition visible?
- Does the reading order remain coherent?
- Are the primary actions still identifiable and usable?
- Is any section waiting indefinitely for a class or observer?
- Does the fallback explain unavailable data or functionality?
- Does reduced-motion mode preserve every useful signal?

This check matters more than an abstract debate about JavaScript bundle size. It measures what the user actually receives when the ideal path breaks.

## Resilience is a design quality

We tend to put progressive enhancement in a technical box: performance, accessibility, or compatibility.

But deciding what remains when a layer fails is a design decision.

Is the page still understandable without its effects? Does its reading order hold without transitions? Is the primary action still obvious? Does the product explain what is missing?

These questions directly affect hierarchy, trust, and experience.

A truly finished design is not merely one that impresses in its perfect state. It preserves its intention when the network slows down, a script breaks, or the user asks for less motion.

## The contract in one sentence

HTML carries the content. CSS carries the presentation. JavaScript adds genuinely dynamic capabilities.

Start by making the page readable and usable. Add responsive behavior, visual states, and movement. Introduce JavaScript only when you can name the functional capability it contributes—then test what happens when it is no longer there.

An animation can be beautiful without being essential.

And **JavaScript must never hold the content hostage.**

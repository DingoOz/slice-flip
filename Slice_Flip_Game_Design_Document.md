# Game Design Document: Slice Flip

*(One-tap knife-flipping slicer inspired by Coolmath Games’ Slice Master)*

## 1. High Concept

Slice Flip is a one-button skill arcade game. A knife automatically travels forward across a side-scrolling level. The player taps once to make it flip and jump. Perfect timing lets the blade slice through objects for points and coins while dodging pink spikes. At the end of every stage, the player aims the final flip at a math-operation pillar that multiplies, adds, subtracts, or divides the run’s earnings. Coins unlock purely cosmetic knife skins.

## 2. Overview

- **Genre**: One-button skill / timing arcade
- **Platforms**: Browser (HTML5) + Mobile (iOS/Android web or native)
- **Session length**: 30 seconds – 3 minutes per run
- **Core fantasy**: “I’m a precision knife that flips through chaos and sticks the perfect landing.”
- **Tone**: Bright, satisfying, slightly stressful, ASMR-friendly

## 3. Target Audience

- Casual players who enjoy one-button games (Drift Boss, Flappy Bird, Stack)
- Kids and teens (Coolmath-style audience)
- Adults who like short “one more run” sessions
- Players who appreciate tactile feedback and cosmetic collection

## 4. Core Gameplay Loop

1. Knife moves forward automatically at constant speed.
2. Player taps to flip the knife (it rotates 180–360° and gains upward momentum).
3. Sharp edge slices objects on contact → particles, sound, score.
4. Blunt end bounces harmlessly off solid surfaces.
5. Contact with pink spikes = instant level restart (lose coins earned that run).
6. Reach the end pillar and stick the knife into a target.
7. Score is modified by the math operation.
8. Coins banked → spend on skins → retry for higher score or next level.

## 5. Mechanics

### Movement
- Constant forward velocity.
- Gravity always active.
- Tap applies an impulse that flips the knife and launches it upward/forward.
- After the flip animation, the knife falls again. Timing the next tap is the entire skill.

### Slicing
- Objects (fruit, blocks, food, presents, logs, etc.) are cut on contact with the blade edge.
- Multiple objects can be sliced in one flip if lined up.
- Combo counter increases with consecutive slices without hitting spikes or missing major targets.

### Obstacles
- **Pink spikes / pink platforms**: Lethal. Any contact ends the run.
- Placement becomes denser and more vertical in later levels.
- Some spikes are hidden under sliceable stacks, requiring height control.

### End-of-Level Pillar
A tall column of targets:
- Addition (+50, +100, +200…)
- Multiplication (×2, ×3, ×4, ×5…)
- Subtraction (−50, −100…)
- Division (÷2, ÷3…)
- Special **BONUS** target (hardest to hit)

Hitting a target applies the operation to the coins earned that level.  
BONUS sends the player into a short, high-value bonus stage filled with dense, valuable objects.

### Bounce Rule
Hitting a wall or object with the handle simply reverses velocity and puts the knife into free-fall. The player can immediately tap again to recover.

## 6. Controls

- **Desktop**: Space or left-click
- **Mobile**: Tap anywhere on screen
- No other inputs.
- Hold does nothing (pure tap timing).

## 7. Levels & Progression

- ~15–20 handcrafted levels that increase in length, object density, and spike difficulty.
- Early levels teach basic flip timing and object slicing.
- Mid levels introduce vertical spikes and multi-object stacks.
- Late levels require precise height control and foresight.
- After the fixed levels, an endless “Score Attack” mode with procedurally denser obstacles.
- Level select unlocks sequentially; previous levels remain replayable for coin farming.

## 8. Scoring & Economy

### Points / Coins
- Every sliced object = base coins (varies by object size/value).
- Combo multiplier applies while the streak continues.
- End-of-level math operation is applied to the total.

### Knife Skins (9 total, cosmetic only)

| Skin                  | Cost (coins) | Theme              |
|-----------------------|--------------|--------------------|
| Default Kitchen Knife | Free         | Classic            |
| Neon Blade            | 5,000        | Glow               |
| Wooden Cleaver        | 12,000       | Rustic             |
| Ice Shard             | 25,000       | Frost particles    |
| Flame Edge            | 40,000       | Fire trail         |
| Golden Edge           | 65,000       | Metallic shine     |
| Cyber Dagger          | 90,000       | Neon trails        |
| Galaxy Saber          | 130,000      | Star particles     |
| Void Splitter         | 180,000      | Dark distortion    |

Skins change only appearance and particle trail. No gameplay advantage.

### Bonus Levels
Short stages with higher coin density. Successfully clearing one yields 2–4× normal coins.

## 9. Visual Style

- Bright, clean, cartoonish 2.5D / 3D.
- Soft pastel backgrounds with simple parallax hills or geometric shapes.
- Highly readable knife silhouette (critical for timing).
- Satisfying slice particles (juice, crumbs, geometric shards).
- Pink spikes clearly differentiated (high saturation warning color).
- End pillar is large and color-coded by operation type.

## 10. Audio

- Distinct, crunchy ASMR slice sounds (different per material).
- Soft “whoosh” on flip.
- Sharp “clack” on lethal hit.
- Rising combo pitch or layered stingers.
- Upbeat but non-intrusive background track.
- Strong emphasis on tactile feedback.

## 11. UI / UX

- Minimal HUD: current coins, combo counter, best score.
- Skin shop accessible from main menu and between levels.
- Clear “Restart” on death (one tap).
- Optional “Watch ad for coins” button.
- Large, readable numbers on the end pillar.
- Mobile-first layout with large tap target.

## 12. Monetization (Free-to-Play)

- Banner / interstitial ads between runs.
- Rewarded video: “Watch ad for 2,000–5,000 coins”.
- No pay-to-win. Skins are purely cosmetic.
- Optional one-time “Remove Ads” IAP.

## 13. Technical Notes

- Physics: simple rigidbody + custom flip impulse.
- Collision layers: Blade, Handle, Spike, Sliceable, Target.
- Object pooling for particles and sliced pieces.
- Save data: coins, unlocked skins, highest level, best scores.
- Target 60 fps on mid-range mobile.
- Works offline after first load.

## 14. Success Metrics

- Average session length > 4 minutes
- “One more run” rate (immediate restart after death) > 70%
- Percentage of players who unlock at least 3 skins
- Retention D1 / D7

## 15. Future Features (Post-Launch)

- Daily challenge levels
- Leaderboards
- Seasonal knife skins
- Additional object themes (candy, space, underwater)
- Two-knife co-op mode

---

This document captures the exact feel and systems of Coolmath Games’ Slice Master while remaining original in naming, skin list, and presentation. It is ready for prototyping or full production.
